import { ontwikkelpadenStateSchema } from "@/lib/gesprekken-schema";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

export function createInitialState(): OntwikkelpadenState {
  return {
    naam: "",
    wereld: "",
    bijPreconSinds: "",
    datum: "",
    datumVorig: "",
    hoofdbeoordelaar: "",
    medebeoordelaar: "",
    hoeGaatHet: "",
    werkdruk: "",
    kernwaarden: "",
    situaties: ["", "", ""],
    impact: "",
    declarabiliteit: "",
    afspraken: "",
    checks: "",
    profiel: "",
    scores: { b: 0, k: 0, o: 0, org: 0, t: 0 },
    opmerkingen: { b: "", k: "", o: "", org: "", t: "" },
    tCellen: [],
    tDiepte: "",
    tBreedte: "",
    tToelichting: "",
    vorigJaar: { vakexpert: 0, adviseur: 0, leider: 0, trainer: 0 },
    niveauCorrectie: {
      vakexpert: null,
      adviseur: null,
      leider: null,
      trainer: null,
    },
    niveauCorrectieToelichting: "",
    ambities: {
      vakexpert: false,
      adviseur: false,
      leider: false,
      trainer: false,
    },
    trainingsgroepen: { vakexpert: "", adviseur: "", leider: "", trainer: "" },
    ambitieNotitie: "",
    niveauInschaling: "",
    toolboxKeuze: "",
    checkpoints: "",
    tProfielOntwikkeling: "",
    gevolgdeTrainingslijnen: [],
    trainingslijnReflecties: [],
    overigeAfspraken: "",
    datumVolgend: "",
    reflecties: [],
    akkoordProfessional: false,
    akkoordProfessionalNaam: "",
    akkoordProfessionalAt: "",
    akkoordHoofdbeoordelaar: false,
    akkoordHoofdbeoordelaarNaam: "",
    akkoordHoofdbeoordelaarAt: "",
    akkoordMedebeoordelaar: false,
    akkoordMedebeoordelaarNaam: "",
    akkoordMedebeoordelaarAt: "",
  };
}

const STATE_KEYS = Object.keys(
  createInitialState(),
) as (keyof OntwikkelpadenState)[];

function isGewoonObject(waarde: unknown): waarde is Record<string, unknown> {
  return (
    typeof waarde === "object" && waarde !== null && !Array.isArray(waarde)
  );
}

/**
 * Legt `bovenop` over `basis` heen. Geneste lijsten met vaste sleutels
 * (scores, opmerkingen, vorig jaar, ambities, ...) worden per sleutel
 * samengevoegd in plaats van vervangen: een import die maar twee van de vijf
 * competentiescores kon lezen, mag de overige drie niet laten verdwijnen.
 */
function leggeOver(
  basis: Record<string, unknown>,
  bovenop: Record<string, unknown>,
): Record<string, unknown> {
  const uitkomst: Record<string, unknown> = { ...basis };
  for (const key of STATE_KEYS) {
    if (!(key in bovenop)) continue;
    const nieuw = bovenop[key];
    const oud = basis[key];
    uitkomst[key] =
      isGewoonObject(oud) && isGewoonObject(nieuw)
        ? { ...oud, ...nieuw }
        : nieuw;
  }
  return uitkomst;
}

export function mergeWithInitialState(input: unknown): OntwikkelpadenState {
  const base = createInitialState() as unknown as Record<string, unknown>;
  if (!isGewoonObject(input)) {
    return ontwikkelpadenStateSchema.parse(base);
  }
  return ontwikkelpadenStateSchema.parse(leggeOver(base, input));
}

/**
 * Voegt het resultaat van een import samen met het gesprek waar je al in zit.
 * Wat de import niet kon lezen blijft zoals het was; geneste lijsten worden
 * per sleutel aangevuld, zodat een gedeeltelijke score-lijst de bestaande
 * scores niet wegvaagt.
 */
export function mergeImportIntoState(
  huidig: OntwikkelpadenState,
  geimporteerd: Partial<OntwikkelpadenState>,
): OntwikkelpadenState {
  return ontwikkelpadenStateSchema.parse(
    leggeOver(
      huidig as unknown as Record<string, unknown>,
      geimporteerd as unknown as Record<string, unknown>,
    ),
  );
}
