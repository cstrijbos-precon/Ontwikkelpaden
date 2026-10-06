import { describe, expect, it } from "vitest";
import {
  somPerCel,
  somPerPad,
  vervullingStatus,
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

describe("vervullingStatus", () => {
  it("meldt een tekort met het aantal dat ontbreekt", () => {
    expect(vervullingStatus(3, 5)).toEqual({ soort: "tekort", verschil: -2 });
  });

  it("meldt op sterkte", () => {
    expect(vervullingStatus(4, 4)).toEqual({
      soort: "op-sterkte",
      verschil: 0,
    });
  });

  it("meldt een overschot", () => {
    expect(vervullingStatus(6, 4)).toEqual({ soort: "overschot", verschil: 2 });
  });

  it("vergelijkt niets zonder norm", () => {
    expect(vervullingStatus(3, 0)).toEqual({ soort: "geen-norm", verschil: 0 });
  });
});
