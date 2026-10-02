import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/account/status/route";

vi.mock("@/lib/db", () => ({
  sql: vi.fn(),
  hasDatabase: () => false,
}));

vi.mock("@/lib/mailer", () => ({
  mailIsIngesteld: () => true,
}));

const beperkMock = vi.fn();

vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  beperk: (...args: unknown[]) => beperkMock(...args),
}));

function verzoek(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/account/status", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const origineleUsers = process.env.APP_USERS;

beforeEach(() => {
  beperkMock
    .mockReset()
    .mockResolvedValue({ toegestaan: true, opnieuwOverSeconden: 0 });
  process.env.APP_USERS = "";
});

afterEach(() => {
  process.env.APP_USERS = origineleUsers;
});

describe("POST /api/account/status", () => {
  it("beantwoordt de vraag als de limiet niet bereikt is", async () => {
    const res = await POST(verzoek({ email: "roos@precongroup.com" }));

    expect(res.status).toBe(200);
    expect((await res.json()).bekend).toBe(false);
  });

  it("telt per IP-adres, uit x-forwarded-for", async () => {
    await POST(
      verzoek(
        { email: "roos@precongroup.com" },
        { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
      ),
    );

    expect(beperkMock).toHaveBeenCalledWith(
      "status:ip:203.0.113.7",
      expect.objectContaining({ max: 60 }),
    );
  });

  it("weigert met 429 en geeft niets prijs als de limiet bereikt is", async () => {
    beperkMock.mockResolvedValueOnce({
      toegestaan: false,
      opnieuwOverSeconden: 45,
    });

    const res = await POST(verzoek({ email: "roos@precongroup.com" }));

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("45");
    expect(await res.json()).not.toHaveProperty("bekend");
  });
});
