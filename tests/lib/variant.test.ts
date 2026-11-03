import { describe, expect, it } from "vitest";
import { berekenAlleNiveaus, berekenNiveau } from "@/lib/bereken-niveau";
import { actieveCorrecties, effectieveNiveaus } from "@/lib/effectief-niveau";
import { createInitialState } from "@/lib/initial-state";
import { bepaalSenioriteit } from "@/lib/senioriteit";
import {
  aantalNiveaus,
  compsVoor,
  padenVoor,
  padIdsVoor,
  variantVan,
} from "@/lib/variant";
import type { PadId } from "@/types/ontwikkelpaden";

const scores = { b: 0, k: 1, o: 1, org: 1, t: 0 };

describe("variantVan", () => {
  it("geeft Support alleen voor de wereld Support", () => {
    expect(variantVan("Support")).toBe("support");
    for (const wereld of ["QA", "RA", "NF", "Learning", "Overhead", ""]) {
      expect(variantVan(wereld)).toBe("standaard");
    }
  });
});

describe("Support-paden", () => {
  it("kent drie paden, met Support professional op de plek van Adviseur", () => {
    expect(padIdsVoor("support")).toEqual(["vakexpert", "adviseur", "leider"]);
    expect(padenVoor("support").adviseur.label).toBe("Support professional");
    expect(padenVoor("standaard").adviseur.label).toBe("Adviseur");
  });

  it("telt het aantal niveaus per pad", () => {
    expect(aantalNiveaus("support", "vakexpert")).toBe(3);
    expect(aantalNiveaus("support", "adviseur")).toBe(4);
    expect(aantalNiveaus("support", "leider")).toBe(5);
    expect(aantalNiveaus("standaard", "vakexpert")).toBe(5);
  });

  it("laat Training en coaching weg", () => {
    expect(compsVoor("support").map((c) => c.id)).toEqual([
      "b",
      "k",
      "o",
      "org",
    ]);
    expect(compsVoor("standaard")).toHaveLength(5);
  });

  it("heeft voor MT-lid 4-4-4-3 sterren", () => {
    expect(padenVoor("support").leider.vereisten[4]).toEqual({
      b: 4,
      k: 4,
      o: 4,
      org: 3,
    });
  });

  it("heeft bij elke vereisten-regel een rol en andersom", () => {
    for (const padId of padIdsVoor("support")) {
      const pad = padenVoor("support")[padId];
      expect(pad.vereisten).toHaveLength(pad.rollen.length);
    }
  });
});

describe("niveau berekenen per variant", () => {
  it("rekent Support professional met eigen sterren", () => {
    // Support specialist vraagt b1 k2 o1 org2; Adviseur niveau 2 vraagt k2 o2 (dus niveau 1).
    const s = { b: 1, k: 2, o: 1, org: 2, t: 0 };
    expect(berekenNiveau("adviseur", s, "support")).toBe(2);
    expect(berekenNiveau("adviseur", s, "standaard")).toBe(1);
  });

  it("laat iemand met Beïnvloedingskracht 0 al op niveau 1 starten", () => {
    expect(berekenNiveau("vakexpert", scores, "support")).toBe(1);
    expect(berekenNiveau("vakexpert", scores, "standaard")).toBe(0);
  });

  it("stopt Vakexpert bij Support op niveau 3", () => {
    const hoog = { b: 4, k: 4, o: 4, org: 4, t: 4 };
    expect(berekenNiveau("vakexpert", hoog, "support")).toBe(3);
    expect(berekenNiveau("vakexpert", hoog, "standaard")).toBe(5);
  });

  it("volgt de wereld in de state", () => {
    const state = { ...createInitialState(), wereld: "Support", scores };
    expect(berekenAlleNiveaus(state).vakexpert).toBe(1);
  });

  it("telt het Trainer-pad niet mee bij Support, ook niet met een oude correctie", () => {
    const state = createInitialState();
    state.wereld = "Support";
    state.scores = { b: 4, k: 4, o: 4, org: 4, t: 4 };
    state.niveauCorrectie.trainer = 3;
    const niveaus = effectieveNiveaus(state);
    expect(niveaus.trainer).toBe(0);
    expect(actieveCorrecties(state).map((c) => c.padId)).not.toContain(
      "trainer",
    );
  });
});

describe("senioriteit bij Support", () => {
  const geenT = { diep: false, breed: false };
  const niv = (v: number, a: number, l: number): Record<PadId, number> => ({
    vakexpert: v,
    adviseur: a,
    leider: l,
    trainer: 0,
  });

  it("negeert het Trainer-pad: twee paden op niveau 2 is medior", () => {
    expect(bepaalSenioriteit(niv(2, 2, 0), geenT, "support").suggestie).toBe(
      "medior",
    );
  });

  it("vraagt voor het niveau-3-criterium om beide overige paden", () => {
    expect(bepaalSenioriteit(niv(3, 1, 0), geenT, "support").suggestie).toBe(
      "junior",
    );
    expect(bepaalSenioriteit(niv(3, 1, 1), geenT, "support").suggestie).toBe(
      "medior",
    );
  });

  it("noemt twee paden op niveau 3 senior", () => {
    expect(bepaalSenioriteit(niv(3, 3, 0), geenT, "support").suggestie).toBe(
      "senior",
    );
  });
});
