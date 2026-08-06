import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/account/route";

const maakMock = vi.fn();
const vindMock = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: vi.fn(),
  hasDatabase: () => true,
}));

vi.mock("@/lib/app-users-store", () => ({
  maakOpgeslagenGebruiker: (...args: unknown[]) => maakMock(...args),
  vindOpgeslagenGebruiker: (...args: unknown[]) => vindMock(...args),
}));

function verzoek(body: unknown) {
  return new Request("http://localhost/api/account", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const origineleUsers = process.env.APP_USERS;
const origineleCode = process.env.APP_REGISTRATIECODE;

beforeEach(() => {
  maakMock.mockReset().mockResolvedValue(true);
  vindMock.mockReset().mockResolvedValue(undefined);
  process.env.APP_USERS = "";
  process.env.APP_REGISTRATIECODE = "";
});

afterEach(() => {
  process.env.APP_USERS = origineleUsers;
  process.env.APP_REGISTRATIECODE = origineleCode;
});

describe("POST /api/account", () => {
  it("maakt een account aan voor een Précon-adres", async () => {
    const res = await POST(
      verzoek({
        email: "Roos@precongroup.com",
        wachtwoord: "Ontwikkel2026",
      }),
    );

    expect(res.status).toBe(201);
    expect(maakMock).toHaveBeenCalled();
    // Het adres wordt genormaliseerd opgeslagen.
    expect(maakMock.mock.calls[0]?.[0]).toBe("roos@precongroup.com");
    // En het wachtwoord nooit in leesbare vorm.
    expect(maakMock.mock.calls[0]?.[1]).toMatch(/^\$2[aby]\$/);
  });

  it("weigert een adres van buiten Précon", async () => {
    const res = await POST(
      verzoek({ email: "vreemde@gmail.com", wachtwoord: "Ontwikkel2026" }),
    );

    expect(res.status).toBe(403);
    expect(maakMock).not.toHaveBeenCalled();
  });

  it("weigert een te zwak wachtwoord", async () => {
    const res = await POST(
      verzoek({ email: "roos@precongroup.com", wachtwoord: "kort" }),
    );

    expect(res.status).toBe(400);
    expect(maakMock).not.toHaveBeenCalled();
  });

  it("overschrijft nooit een account dat in de database staat", async () => {
    vindMock.mockResolvedValue({
      email: "roos@precongroup.com",
      passwordHash: "$2b$12$bestaand",
    });

    const res = await POST(
      verzoek({ email: "roos@precongroup.com", wachtwoord: "Ontwikkel2026" }),
    );

    expect(res.status).toBe(409);
    expect(maakMock).not.toHaveBeenCalled();
  });

  it("overschrijft nooit een account uit APP_USERS", async () => {
    process.env.APP_USERS = "kim@precongroup.com:$2b$12$bestaandehash";

    const res = await POST(
      verzoek({ email: "kim@precongroup.com", wachtwoord: "Ontwikkel2026" }),
    );

    expect(res.status).toBe(409);
    expect(maakMock).not.toHaveBeenCalled();
  });

  it("verliest de race als iemand net iets eerder was", async () => {
    maakMock.mockResolvedValue(false);

    const res = await POST(
      verzoek({ email: "roos@precongroup.com", wachtwoord: "Ontwikkel2026" }),
    );

    expect(res.status).toBe(409);
  });

  it("eist de registratiecode zodra die is ingesteld", async () => {
    process.env.APP_REGISTRATIECODE = "precon2026";

    const zonder = await POST(
      verzoek({ email: "roos@precongroup.com", wachtwoord: "Ontwikkel2026" }),
    );
    expect(zonder.status).toBe(403);
    expect(maakMock).not.toHaveBeenCalled();

    const met = await POST(
      verzoek({
        email: "roos@precongroup.com",
        wachtwoord: "Ontwikkel2026",
        code: "precon2026",
      }),
    );
    expect(met.status).toBe(201);
  });
});
