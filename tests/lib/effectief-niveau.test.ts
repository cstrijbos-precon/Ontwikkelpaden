import { describe, expect, it } from "vitest";
import {
  actieveCorrecties,
  effectiefNiveau,
  effectieveNiveaus,
  toelichtingOntbreekt,
} from "@/lib/effectief-niveau";
import { createInitialState } from "@/lib/initial-state";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

/** Scores die Vakexpert op niveau 1 zetten (b/k/o/org allemaal 1). */
function stateMetNiveau1(): OntwikkelpadenState {
  const state = createInitialState();
  state.scores = { b: 1, k: 1, o: 1, org: 1, t: 0 };
  return state;
}

describe("effectiefNiveau", () => {
  it("volgt de berekening zolang er niets is verschoven", () => {
    const state = stateMetNiveau1();
    expect(effectiefNiveau("vakexpert", state)).toBe(1);
  });

  it("laat een handmatige correctie voorgaan op de berekening", () => {
    const state = stateMetNiveau1();
    state.niveauCorrectie.vakexpert = 4;
    expect(effectiefNiveau("vakexpert", state)).toBe(4);
  });

  it("accepteert een correctie die lager is dan de berekening", () => {
    const state = stateMetNiveau1();
    state.niveauCorrectie.vakexpert = 0;
    expect(effectiefNiveau("vakexpert", state)).toBe(0);
  });

  it("geeft alle vier de paden terug", () => {
    const state = stateMetNiveau1();
    state.niveauCorrectie.trainer = 3;
    expect(effectieveNiveaus(state)).toEqual({
      vakexpert: 1,
      adviseur: 1,
      leider: 1,
      trainer: 3,
    });
  });
});

describe("actieveCorrecties", () => {
  it("is leeg zonder aanpassingen", () => {
    expect(actieveCorrecties(stateMetNiveau1())).toEqual([]);
  });

  it("negeert een correctie die gelijk is aan de berekening", () => {
    const state = stateMetNiveau1();
    state.niveauCorrectie.vakexpert = 1;
    expect(actieveCorrecties(state)).toEqual([]);
  });

  it("beschrijft een afwijkende correctie met beide niveaus", () => {
    const state = stateMetNiveau1();
    state.niveauCorrectie.vakexpert = 3;
    const correcties = actieveCorrecties(state);
    expect(correcties).toHaveLength(1);
    expect(correcties[0]).toMatchObject({
      padId: "vakexpert",
      padLabel: "Vakexpert",
      berekend: 1,
      gecorrigeerd: 3,
    });
  });
});

describe("toelichtingOntbreekt", () => {
  it("is onwaar zonder aanpassingen", () => {
    expect(toelichtingOntbreekt(stateMetNiveau1())).toBe(false);
  });

  it("is waar bij een aanpassing zonder tekst", () => {
    const state = stateMetNiveau1();
    state.niveauCorrectie.vakexpert = 3;
    expect(toelichtingOntbreekt(state)).toBe(true);

    state.niveauCorrectieToelichting = "   ";
    expect(toelichtingOntbreekt(state)).toBe(true);
  });

  it("is onwaar zodra er een toelichting staat", () => {
    const state = stateMetNiveau1();
    state.niveauCorrectie.vakexpert = 3;
    state.niveauCorrectieToelichting = "Ervaring van vorige werkgever.";
    expect(toelichtingOntbreekt(state)).toBe(false);
  });
});
