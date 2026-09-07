import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/lib/initial-state";
import {
  bepaalNieuweOndertekeningen,
  mailOndertekenaars,
} from "@/lib/ondertekeningmail";
import type { Gesprek } from "@/types/gesprekken";

const verstuurMailMock = vi.fn();
const mailIsIngesteldMock = vi.fn();

vi.mock("@/lib/mailer", () => ({
  verstuurMail: (...args: unknown[]) => verstuurMailMock(...args),
  mailIsIngesteld: () => mailIsIngesteldMock(),
}));

function gesprek(overrides: Partial<Gesprek> = {}): Gesprek {
  return {
    id: "gesprek-1",
    medewerkerNaam: "Bieke",
    medewerkerEmail: "bieke@precongroup.com",
    wereld: "RA",
    bijPreconSinds: "2022",
    gesprekDatum: "2026-01-01",
    datumVorig: null,
    datumVolgend: null,
    hoofdbeoordelaar: "sofie@precongroup.com",
    hoofdbeoordelaarStatus: "toegestaan",
    medebeoordelaar: "chantal@tal-leadership.nl",
    medebeoordelaarStatus: "toegestaan",
    status: "draft",
    state: createInitialState(),
    previousGesprekId: null,
    createdBy: "sofie@precongroup.com",
    updatedBy: "sofie@precongroup.com",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  verstuurMailMock.mockReset().mockResolvedValue(undefined);
  mailIsIngesteldMock.mockReset().mockReturnValue(true);
});

describe("bepaalNieuweOndertekeningen", () => {
  it("herkent een verse handtekening van de professional", () => {
    const vorige = createInitialState();
    const nieuwe = { ...createInitialState(), akkoordProfessional: true };
    expect(bepaalNieuweOndertekeningen(vorige, nieuwe)).toEqual([
      "professional",
    ]);
  });

  it("herkent meerdere handtekeningen in één keer", () => {
    const vorige = createInitialState();
    const nieuwe = {
      ...createInitialState(),
      akkoordHoofdbeoordelaar: true,
      akkoordMedebeoordelaar: true,
    };
    expect(bepaalNieuweOndertekeningen(vorige, nieuwe)).toEqual([
      "hoofdbeoordelaar",
      "medebeoordelaar",
    ]);
  });

  it("ziet niets als er niets is veranderd", () => {
    const state = { ...createInitialState(), akkoordProfessional: true };
    expect(bepaalNieuweOndertekeningen(state, state)).toEqual([]);
  });

  it("ziet geen nieuwe handtekening als een akkoord al stond", () => {
    const state = { ...createInitialState(), akkoordProfessional: true };
    expect(bepaalNieuweOndertekeningen(state, state)).toEqual([]);
  });
});

describe("mailOndertekenaars", () => {
  it("mailt alle andere rollen die nog moeten tekenen, niet de ondertekenaar zelf", async () => {
    await mailOndertekenaars(gesprek(), "professional");

    expect(verstuurMailMock).toHaveBeenCalledTimes(2);
    const adressen = verstuurMailMock.mock.calls.map((c) => c[0].aan);
    expect(adressen).toContain("sofie@precongroup.com");
    expect(adressen).toContain("chantal@tal-leadership.nl");
  });

  it("slaat een rol over die al getekend heeft", async () => {
    const state = createInitialState();
    state.akkoordHoofdbeoordelaar = true;

    await mailOndertekenaars(gesprek({ state }), "professional");

    expect(verstuurMailMock).toHaveBeenCalledTimes(1);
    expect(verstuurMailMock.mock.calls[0]?.[0].aan).toBe(
      "chantal@tal-leadership.nl",
    );
  });

  it("slaat een rol over zonder geldig e-mailadres in de kolom", async () => {
    // Bijvoorbeeld een naam uit een geïmporteerd Word/PDF-bestand, geen adres.
    await mailOndertekenaars(
      gesprek({ hoofdbeoordelaar: "Sofie Nackaerts" }),
      "professional",
    );

    const adressen = verstuurMailMock.mock.calls.map((c) => c[0].aan);
    expect(adressen).not.toContain("Sofie Nackaerts");
  });

  it("doet niets zonder ingesteld mailkanaal", async () => {
    mailIsIngesteldMock.mockReturnValue(false);
    await mailOndertekenaars(gesprek(), "professional");
    expect(verstuurMailMock).not.toHaveBeenCalled();
  });

  it("laat opslaan niet mislukken als het versturen faalt", async () => {
    verstuurMailMock.mockRejectedValue(new Error("smtp weg"));
    await expect(
      mailOndertekenaars(gesprek(), "professional"),
    ).resolves.toBeUndefined();
  });
});
