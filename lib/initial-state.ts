import { ontwikkelpadenStateSchema } from "@/lib/gesprekken-schema";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

export function createInitialState(): OntwikkelpadenState {
  return {
    naam: "",
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
    vorigJaar: { vakexpert: 0, adviseur: 0, leider: 0, trainer: 0 },
    ambities: {
      vakexpert: false,
      adviseur: false,
      leider: false,
      trainer: false,
    },
    trainingsgroepen: { vakexpert: "", adviseur: "", leider: "", trainer: "" },
    ambitieNotitie: "",
    toolboxKeuze: "",
    checkpoints: "",
    tProfielOntwikkeling: "",
    overigeAfspraken: "",
    datumVolgend: "",
  };
}

const STATE_KEYS = Object.keys(
  createInitialState(),
) as (keyof OntwikkelpadenState)[];

export function mergeWithInitialState(input: unknown): OntwikkelpadenState {
  const base = createInitialState();
  if (typeof input !== "object" || input === null) {
    return ontwikkelpadenStateSchema.parse(base);
  }

  const partial = input as Record<string, unknown>;
  const picked: Record<string, unknown> = { ...base };
  for (const key of STATE_KEYS) {
    if (key in partial) {
      picked[key] = partial[key];
    }
  }

  return ontwikkelpadenStateSchema.parse(picked);
}
