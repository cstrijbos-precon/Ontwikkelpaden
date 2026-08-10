import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/account/route";

const maakMock = vi.fn();
const vindMock = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: vi.fn(),
  hasDatabase: () => true,
}));

const bevestigMock = vi.fn();

vi.mock("@/lib/app-users-store", () => ({
  maakOnbevestigdAccount: (...args: unknown[]) => maakMock(...args),
  vindOpgeslagenGebruiker: (...args: unknown[]) => vindMock(...args),
  bevestigDirect: (...args: unknown[]) => bevestigMock(...args),
}));

const mailMock = vi.fn();

vi.mock("@/lib/mailer", () => ({
  mailIsIngesteld: () => mailIngesteld,
}));

vi.mock("@/lib/verificatiemail", () => ({
  stuurVerificatiemail: (...args: unknown[]) => mailMock(...args),
}));

let mailIngesteld = true;

function verzoek(body: unknown) {
  return new Request("http://localhost/api/account", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const origineleUsers = process.env.APP_USERS;
const origineleCode = process.env.APP_REGISTRATIECODE;
const origineleUitzonderingen = process.env.APP_VERIFICATIE_UITZONDERINGEN;

beforeEach(() => {
  maakMock.mockReset().mockResolvedValue(true);
  vindMock.mockReset().mockResolvedValue(undefined);
  mailMock.mockReset().mockResolvedValue(undefined);
  bevestigMock.mockReset().mockResolvedValue(undefined);
  mailIngesteld = true;
  process.env.APP_USERS = "";
  process.env.APP_REGISTRATIECODE = "";
  process.env.APP_VERIFICATIE_UITZONDERINGEN = "";
});

afterEach(() => {
  process.env.APP_USERS = origineleUsers;
  process.env.APP_REGISTRATIECODE = origineleCode;
  process.env.APP_VERIFICATIE_UITZONDERINGEN = origineleUitzonderingen;
});

describe("POST /api/account", () => {
  it("maakt een account aan en stuurt een verificatiemail", async () => {
    const res = await POST(
      verzoek({
        email: "Roos@precongroup.com",
        wachtwoord: "Ontwikkel2026",
      }),
    );

    expect(res.status).toBe(201);
    expect(mailMock).toHaveBeenCalledWith("roos@precongroup.com");
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

  it("weigert aanmelden als er geen mail verstuurd kan worden", async () => {
    mailIngesteld = false;

    const res = await POST(
      verzoek({ email: "roos@precongroup.com", wachtwoord: "Ontwikkel2026" }),
    );

    expect(res.status).toBe(503);
    expect(maakMock).not.toHaveBeenCalled();
  });

  it("meldt het als de verificatiemail niet verstuurd kan worden", async () => {
    mailMock.mockRejectedValue(new Error("smtp weg"));

    const res = await POST(
      verzoek({ email: "roos@precongroup.com", wachtwoord: "Ontwikkel2026" }),
    );

    expect(res.status).toBe(502);
  });

  it("laat een uitgezonderd adres direct door, zonder mail", async () => {
    process.env.APP_VERIFICATIE_UITZONDERINGEN = "snackaerts@precongroup.com";
    mailIngesteld = false;

    const res = await POST(
      verzoek({
        email: "snackaerts@precongroup.com",
        wachtwoord: "Ontwikkel2026",
      }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ verificatieVerstuurd: false });
    expect(bevestigMock).toHaveBeenCalledWith("snackaerts@precongroup.com");
    expect(mailMock).not.toHaveBeenCalled();
  });

  it("houdt de eis overeind voor wie niet op de lijst staat", async () => {
    process.env.APP_VERIFICATIE_UITZONDERINGEN = "snackaerts@precongroup.com";
    mailIngesteld = false;

    const res = await POST(
      verzoek({
        email: "iemand.anders@precongroup.com",
        wachtwoord: "Ontwikkel2026",
      }),
    );

    expect(res.status).toBe(503);
    expect(maakMock).not.toHaveBeenCalled();
    expect(bevestigMock).not.toHaveBeenCalled();
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
