import { describe, expect, it } from "vitest";
import {
  reactiePerPad,
  somPerCel,
  somPerPad,
  verdelingPerCel,
  verdelingStatus,
} from "@/lib/vlootschouw/aggregatie";
import type { RolRij } from "@/lib/vlootschouw/types";

function rij(overrides: Partial<RolRij>): RolRij {
  return {
    padId: "vakexpert",
    niveau: 1,
    rolNaam: "Consultant",
    wereld: "QA",
    aanwezig: 0,
    nodigNu: 0,
    nodigStraks: 0,
    ...overrides,
  };
}

const ROLLEN: RolRij[] = [
  rij({ wereld: "QA", aanwezig: 3, nodigNu: 4, nodigStraks: 5 }),
  rij({ wereld: "RA", aanwezig: 2, nodigNu: 1, nodigStraks: 2 }),
  rij({ niveau: 2, wereld: "QA", aanwezig: 1, nodigNu: 1, nodigStraks: 1 }),
  rij({ padId: "leider", niveau: 1, wereld: "QA", aanwezig: 9, nodigNu: 9 }),
];

describe("somPerCel", () => {
  it("telt over alle werelden bij 'totaal'", () => {
    expect(somPerCel(ROLLEN, "vakexpert", 1, "totaal")).toEqual({
      aanwezig: 5,
      nodigNu: 5,
      nodigStraks: 7,
    });
  });

  it("geeft alleen die wereld bij een gekozen filter", () => {
    expect(somPerCel(ROLLEN, "vakexpert", 1, "RA")).toEqual({
      aanwezig: 2,
      nodigNu: 1,
      nodigStraks: 2,
    });
  });

  it("geeft nullen voor een positie zonder gegevens", () => {
    expect(somPerCel(ROLLEN, "trainer", 5, "totaal")).toEqual({
      aanwezig: 0,
      nodigNu: 0,
      nodigStraks: 0,
    });
  });

  it("meng niet met andere paden of niveaus", () => {
    expect(somPerCel(ROLLEN, "vakexpert", 2, "totaal").aanwezig).toBe(1);
    expect(somPerCel(ROLLEN, "leider", 1, "totaal").aanwezig).toBe(9);
  });
});

describe("somPerPad", () => {
  it("telt alle niveaus van het pad op", () => {
    expect(somPerPad(ROLLEN, "vakexpert", "totaal")).toEqual({
      aanwezig: 6,
      nodigNu: 6,
      nodigStraks: 8,
    });
  });

  it("respecteert het wereldfilter", () => {
    expect(somPerPad(ROLLEN, "vakexpert", "QA")).toEqual({
      aanwezig: 4,
      nodigNu: 5,
      nodigStraks: 6,
    });
  });
});

/**
 * Het voorbeeld uit de praktijk: RA heeft 40 mensen. De norm verdeelt die over
 * de niveaus van het pad; tot nu toe heeft er één persoon een gesprek ingevuld.
 */
const RA_PAD: RolRij[] = [
  rij({ wereld: "RA", niveau: 1, aanwezig: 0, nodigNu: 10 }),
  rij({ wereld: "RA", niveau: 2, aanwezig: 1, nodigNu: 20 }),
  rij({ wereld: "RA", niveau: 3, aanwezig: 0, nodigNu: 10 }),
];

describe("verdelingPerCel", () => {
  it("geeft per niveau het aandeel binnen het pad, nu en gewenst", () => {
    // Van de 40 gewenste mensen hoort de helft op niveau 2; de ene ingeschaalde
    // persoon zit daar ook: 100% van de ingeschaalden.
    expect(verdelingPerCel(RA_PAD, "vakexpert", 2, "RA")).toMatchObject({
      aanwezig: 1,
      nodigNu: 20,
      aanwezigPct: 100,
      gewenstPct: 50,
      verschilPunten: 50,
    });
  });

  it("deelt door het pad, niet door de hele populatie", () => {
    // Met de oude berekening was dit 1/20 = 5%. De verdeling zegt iets anders.
    const cel = verdelingPerCel(RA_PAD, "vakexpert", 2, "RA");
    expect(cel.aanwezigPct).not.toBe(5);
  });

  it("geeft 0% voor een niveau waar niemand zit terwijl anderen wel zijn ingeschaald", () => {
    expect(verdelingPerCel(RA_PAD, "vakexpert", 1, "RA")).toMatchObject({
      aanwezigPct: 0,
      gewenstPct: 25,
      verschilPunten: -25,
    });
  });

  it("laat het aandeel leeg zolang er nog niemand is ingeschaald", () => {
    const leeg = RA_PAD.map((r) => ({ ...r, aanwezig: 0 }));
    expect(verdelingPerCel(leeg, "vakexpert", 2, "RA")).toMatchObject({
      aanwezigPct: null,
      gewenstPct: 50,
      verschilPunten: null,
    });
  });

  it("laat het gewenste aandeel leeg zolang er geen norm is ingevuld", () => {
    const zonderNorm = RA_PAD.map((r) => ({ ...r, nodigNu: 0 }));
    expect(verdelingPerCel(zonderNorm, "vakexpert", 2, "RA")).toMatchObject({
      aanwezigPct: 100,
      gewenstPct: null,
      verschilPunten: null,
    });
  });

  it("telt bij 'totaal' alle werelden samen, en bij een wereld alleen die", () => {
    const rollen = [
      ...RA_PAD,
      rij({ wereld: "QA", niveau: 1, aanwezig: 3, nodigNu: 10 }),
      rij({ wereld: "QA", niveau: 2, aanwezig: 0, nodigNu: 10 }),
    ];
    // Totaal: niveau 1 heeft 3 van 4 ingeschaalden (75%), gewenst 20 van 60 (33%).
    expect(verdelingPerCel(rollen, "vakexpert", 1, "totaal")).toMatchObject({
      aanwezigPct: 75,
      gewenstPct: 33,
    });
    expect(verdelingPerCel(rollen, "vakexpert", 1, "RA").aanwezigPct).toBe(0);
  });

  it("rondt af op hele procenten", () => {
    const rollen = [
      rij({ niveau: 1, aanwezig: 1, nodigNu: 1 }),
      rij({ niveau: 2, aanwezig: 2, nodigNu: 1 }),
    ];
    // 1 van 3 = 33,3% en 1 van 2 = 50%; verschil -16,7 wordt -17.
    expect(verdelingPerCel(rollen, "vakexpert", 1, "totaal")).toMatchObject({
      aanwezigPct: 33,
      gewenstPct: 50,
      verschilPunten: -17,
    });
  });
});

describe("verdelingStatus", () => {
  it("noemt een klein verschil 'op niveau'", () => {
    expect(verdelingStatus(0)).toBe("op niveau".replace(" ", "-"));
    expect(verdelingStatus(5)).toBe("op-niveau");
    expect(verdelingStatus(-5)).toBe("op-niveau");
  });

  it("meldt onder of boven zodra het verschil groter is dan de tolerantie", () => {
    expect(verdelingStatus(-6)).toBe("onder");
    expect(verdelingStatus(6)).toBe("boven");
  });

  it("zegt niets zonder gegevens", () => {
    expect(verdelingStatus(null)).toBe("geen-data");
  });
});

describe("reactiePerPad", () => {
  it("geeft hoeveel van de populatie al is ingeschaald", () => {
    expect(reactiePerPad(RA_PAD, "vakexpert", "RA")).toEqual({
      ingeschaald: 1,
      nodig: 40,
      pct: 3,
    });
  });

  it("geeft geen percentage zonder norm", () => {
    const zonderNorm = RA_PAD.map((r) => ({ ...r, nodigNu: 0 }));
    expect(reactiePerPad(zonderNorm, "vakexpert", "RA").pct).toBeNull();
  });
});
