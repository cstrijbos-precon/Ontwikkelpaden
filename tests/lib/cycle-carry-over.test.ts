import { describe, expect, it } from "vitest";
import { buildNextCycleState } from "@/lib/cycle-carry-over";
import { createInitialState } from "@/lib/initial-state";

function afgerondGesprek() {
  const state = createInitialState();
  state.naam = "Pien";
  state.wereld = "RA";
  state.bijPreconSinds = "januari 2022";
  state.niveauInschaling = "Medior";
  state.datum = "2026-06-08";
  state.hoofdbeoordelaar = "Chantal";
  state.medebeoordelaar = "Evan";
  state.scores = { b: 3, k: 3, o: 2, org: 3, t: 0 };
  state.opmerkingen = {
    b: "toelichting b",
    k: "toelichting k",
    o: "",
    org: "",
    t: "",
  };
  state.tCellen = ["0-1", "1-1", "2-1"];
  state.tDiepte = "Adviesvaardigheden";
  state.tBreedte = "Projectleiding";
  state.hoeGaatHet = "Goed";
  state.situaties = ["Situatie 1", "Situatie 2", ""];
  state.ambities = {
    vakexpert: false,
    adviseur: true,
    leider: false,
    trainer: false,
  };
  state.trainingsgroepen = {
    vakexpert: "",
    adviseur: "adviseur-3",
    leider: "",
    trainer: "",
  };
  state.ambitieNotitie = "Wil doorgroeien naar accountmanager";
  state.toolboxKeuze = "Trainingslijn Adviseur 3";
  state.checkpoints = "Elke 6 weken sparren";
  state.tProfielOntwikkeling = "Vooral in de breedte";
  state.overigeAfspraken = "Inwerkschema afronden";
  state.datumVolgend = "2027-06-01";
  state.reflecties = [{ id: "r1", datum: "2026-09-01", tekst: "Tussentijds" }];
  state.akkoordProfessional = true;
  state.akkoordHoofdbeoordelaar = true;
  state.akkoordMedebeoordelaar = true;
  return state;
}

describe("buildNextCycleState", () => {
  it("copies naam, bijPreconSinds en niveauInschaling", () => {
    const next = buildNextCycleState(afgerondGesprek());
    expect(next.naam).toBe("Pien");
    expect(next.wereld).toBe("RA");
    expect(next.bijPreconSinds).toBe("januari 2022");
    expect(next.niveauInschaling).toBe("Medior");
  });

  it("copies sterrenscores en T-profiel-framework (tCellen)", () => {
    const next = buildNextCycleState(afgerondGesprek());
    expect(next.scores).toEqual({ b: 3, k: 3, o: 2, org: 3, t: 0 });
    expect(next.tCellen).toEqual(["0-1", "1-1", "2-1"]);
  });

  it("zet vorigJaar op basis van de sterren van het afgeronde gesprek", () => {
    const next = buildNextCycleState(afgerondGesprek());
    expect(next.vorigJaar.adviseur).toBeGreaterThan(0);
  });

  it("zet datumVorig op de datum van het afgeronde gesprek en maakt datum leeg", () => {
    const next = buildNextCycleState(afgerondGesprek());
    expect(next.datumVorig).toBe("2026-06-08");
    expect(next.datum).toBe("");
    expect(next.datumVolgend).toBe("");
  });

  it("reset hoofd- en medebeoordelaar", () => {
    const next = buildNextCycleState(afgerondGesprek());
    expect(next.hoofdbeoordelaar).toBe("");
    expect(next.medebeoordelaar).toBe("");
  });

  it("reset ambitie en trainingsgroep", () => {
    const next = buildNextCycleState(afgerondGesprek());
    expect(next.ambities.adviseur).toBe(false);
    expect(next.trainingsgroepen.adviseur).toBe("");
  });

  it("maakt alle overige tekstvelden leeg", () => {
    const next = buildNextCycleState(afgerondGesprek());
    expect(next.opmerkingen).toEqual({ b: "", k: "", o: "", org: "", t: "" });
    expect(next.tDiepte).toBe("");
    expect(next.tBreedte).toBe("");
    expect(next.hoeGaatHet).toBe("");
    expect(next.situaties).toEqual(["", "", ""]);
    expect(next.ambitieNotitie).toBe("");
    expect(next.toolboxKeuze).toBe("");
    expect(next.checkpoints).toBe("");
    expect(next.tProfielOntwikkeling).toBe("");
    expect(next.overigeAfspraken).toBe("");
  });

  it("reset reflecties en akkoordvlaggen", () => {
    const next = buildNextCycleState(afgerondGesprek());
    expect(next.reflecties).toEqual([]);
    expect(next.akkoordProfessional).toBe(false);
    expect(next.akkoordHoofdbeoordelaar).toBe(false);
    expect(next.akkoordMedebeoordelaar).toBe(false);
  });
});
