import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/medewerkers/koppel-beoordelaar/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  hasDatabase: vi.fn(),
}));

vi.mock("@/lib/gesprekken", () => ({
  BeoordelaarAlGekoppeldError: class BeoordelaarAlGekoppeldError extends Error {},
  MedewerkerNietGevondenError: class MedewerkerNietGevondenError extends Error {},
  requestBeoordelaarKoppeling: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import {
  BeoordelaarAlGekoppeldError,
  MedewerkerNietGevondenError,
  requestBeoordelaarKoppeling,
} from "@/lib/gesprekken";

function request(body: unknown) {
  return new Request("http://x", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/medewerkers/koppel-beoordelaar", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    const res = await POST(request({}));
    expect(res.status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    const res = await POST(request({}));
    expect(res.status).toBe(503);
  });

  it("returns 400 for invalid JSON", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    const res = await POST(
      new Request("http://x", { method: "POST", body: "not-json{" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for validation failure", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    const res = await POST(request({ rol: "onbekend" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when medewerker not found", async () => {
    mockAuthUser("beoordelaar@precon.nl");
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(requestBeoordelaarKoppeling).mockRejectedValue(
      new MedewerkerNietGevondenError(),
    );

    const res = await POST(
      request({ medewerkerEmail: "jan@precon.nl", rol: "hoofdbeoordelaar" }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 409 when already koppeld", async () => {
    mockAuthUser("beoordelaar@precon.nl");
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(requestBeoordelaarKoppeling).mockRejectedValue(
      new BeoordelaarAlGekoppeldError(),
    );

    const res = await POST(
      request({ medewerkerEmail: "jan@precon.nl", rol: "hoofdbeoordelaar" }),
    );
    expect(res.status).toBe(409);
  });

  it("returns 201 on success", async () => {
    mockAuthUser("beoordelaar@precon.nl");
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(requestBeoordelaarKoppeling).mockResolvedValue({
      id: "gesprek-1",
    } as Awaited<ReturnType<typeof requestBeoordelaarKoppeling>>);

    const res = await POST(
      request({ medewerkerEmail: "jan@precon.nl", rol: "hoofdbeoordelaar" }),
    );
    expect(res.status).toBe(201);
  });

  it("returns 500 on unexpected error", async () => {
    mockAuthUser("beoordelaar@precon.nl");
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(requestBeoordelaarKoppeling).mockRejectedValue(new Error("db"));

    const res = await POST(
      request({ medewerkerEmail: "jan@precon.nl", rol: "hoofdbeoordelaar" }),
    );
    expect(res.status).toBe(500);
  });
});
