import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  beantwoordHoofdbeoordelaarKoppeling,
  haalHoofdbeoordelaarKoppeling,
  haalMedewerkersVoorHoofdbeoordelaar,
  haalWachtendeHoofdbeoordelaar,
  isStandingHoofdbeoordelaar,
  stelHoofdbeoordelaarVoor,
  stelHoofdbeoordelaarVoorDirect,
} from "@/lib/hoofdbeoordelaar-koppeling";

const sqlMock = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
  hasDatabase: () => false,
}));

function koppelingRow(overrides: Record<string, unknown> = {}) {
  return {
    medewerker_email: "jan@precon.nl",
    hoofdbeoordelaar_email: "kim@precon.nl",
    status: "in_afwachting",
    aangemaakt_door: "kim@precon.nl",
    ...overrides,
  };
}

const origineleUsers = process.env.APP_USERS;

beforeEach(() => {
  sqlMock.mockReset();
  process.env.APP_USERS = "";
});

afterEach(() => {
  process.env.APP_USERS = origineleUsers;
});

describe("stelHoofdbeoordelaarVoor", () => {
  it("wacht op akkoord als de medewerker al een account heeft", async () => {
    process.env.APP_USERS = "jan@precon.nl:$2b$12$" + "x".repeat(53);
    sqlMock.mockResolvedValueOnce([koppelingRow({ status: "in_afwachting" })]);

    const koppeling = await stelHoofdbeoordelaarVoor(
      "jan@precon.nl",
      "kim@precon.nl",
      "kim@precon.nl",
    );

    expect(koppeling.status).toBe("in_afwachting");
    expect(sqlMock.mock.calls[0]).toContain("in_afwachting");
  });

  it("geeft direct toegang als de medewerker nog geen account heeft", async () => {
    sqlMock.mockResolvedValueOnce([koppelingRow({ status: "toegestaan" })]);

    const koppeling = await stelHoofdbeoordelaarVoor(
      "nieuw@precon.nl",
      "kim@precon.nl",
      "kim@precon.nl",
    );

    expect(koppeling.status).toBe("toegestaan");
  });
});

describe("stelHoofdbeoordelaarVoorDirect", () => {
  it("is altijd meteen toegestaan — de medewerker koos dit zelf", async () => {
    sqlMock.mockResolvedValueOnce([]);

    await stelHoofdbeoordelaarVoorDirect("jan@precon.nl", "kim@precon.nl");

    const [strings] = sqlMock.mock.calls[0] as [TemplateStringsArray];
    expect(strings.join("")).toContain("'toegestaan'");
  });
});

describe("isStandingHoofdbeoordelaar", () => {
  it("is waar bij een toegestane koppeling met hetzelfde e-mailadres", async () => {
    sqlMock.mockResolvedValueOnce([
      koppelingRow({
        status: "toegestaan",
        hoofdbeoordelaar_email: "Kim@Precon.nl",
      }),
    ]);

    expect(
      await isStandingHoofdbeoordelaar("jan@precon.nl", "kim@precon.nl"),
    ).toBe(true);
  });

  it("is onwaar zolang de koppeling nog in afwachting is", async () => {
    sqlMock.mockResolvedValueOnce([koppelingRow({ status: "in_afwachting" })]);

    expect(
      await isStandingHoofdbeoordelaar("jan@precon.nl", "kim@precon.nl"),
    ).toBe(false);
  });

  it("is onwaar zonder medewerker-e-mailadres", async () => {
    expect(await isStandingHoofdbeoordelaar(null, "kim@precon.nl")).toBe(false);
    expect(sqlMock).not.toHaveBeenCalled();
  });
});

describe("haalMedewerkersVoorHoofdbeoordelaar", () => {
  it("geeft alleen de e-mailadressen terug", async () => {
    sqlMock.mockResolvedValueOnce([
      { medewerker_email: "jan@precon.nl" },
      { medewerker_email: "piet@precon.nl" },
    ]);

    expect(await haalMedewerkersVoorHoofdbeoordelaar("kim@precon.nl")).toEqual([
      "jan@precon.nl",
      "piet@precon.nl",
    ]);
  });
});

describe("haalWachtendeHoofdbeoordelaar", () => {
  it("geeft de koppeling terug als die in afwachting is", async () => {
    sqlMock.mockResolvedValueOnce([koppelingRow({ status: "in_afwachting" })]);

    const wachtend = await haalWachtendeHoofdbeoordelaar("jan@precon.nl");
    expect(wachtend?.hoofdbeoordelaarEmail).toBe("kim@precon.nl");
  });

  it("geeft niets terug als de koppeling al is goedgekeurd", async () => {
    sqlMock.mockResolvedValueOnce([koppelingRow({ status: "toegestaan" })]);
    expect(await haalWachtendeHoofdbeoordelaar("jan@precon.nl")).toBeNull();
  });

  it("geeft niets terug zonder koppeling", async () => {
    sqlMock.mockResolvedValueOnce([]);
    expect(await haalWachtendeHoofdbeoordelaar("jan@precon.nl")).toBeNull();
  });
});

describe("haalHoofdbeoordelaarKoppeling", () => {
  it("geeft null als er niets is", async () => {
    sqlMock.mockResolvedValueOnce([]);
    expect(await haalHoofdbeoordelaarKoppeling("jan@precon.nl")).toBeNull();
  });
});

describe("beantwoordHoofdbeoordelaarKoppeling", () => {
  it("goedkeuren zet de status op toegestaan", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await beantwoordHoofdbeoordelaarKoppeling("jan@precon.nl", "goedkeuren");

    const [strings] = sqlMock.mock.calls[0] as [TemplateStringsArray];
    const tekst = strings.join("");
    expect(tekst).toContain("UPDATE hoofdbeoordelaar_koppelingen");
    expect(tekst).toContain("'toegestaan'");
  });

  it("afwijzen verwijdert de koppeling volledig", async () => {
    // Geen halfslachtige status: wie is afgewezen staat nergens meer.
    sqlMock.mockResolvedValueOnce([]);
    await beantwoordHoofdbeoordelaarKoppeling("jan@precon.nl", "afwijzen");

    const [strings] = sqlMock.mock.calls[0] as [TemplateStringsArray];
    expect(strings.join("")).toContain(
      "DELETE FROM hoofdbeoordelaar_koppelingen",
    );
  });
});
