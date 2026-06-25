import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

export const STORAGE_KEY = "precon_v3";

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
    ambities: { vakexpert: false, adviseur: false, leider: false, trainer: false },
    trainingsgroepen: { vakexpert: "", adviseur: "", leider: "", trainer: "" },
    ambitieNotitie: "",
    toolboxKeuze: "",
    checkpoints: "",
    tProfielOntwikkeling: "",
    overigeAfspraken: "",
    datumVolgend: "",
  };
}

export function loadStateFromStorage(): OntwikkelpadenState {
  const initial = createInitialState();
  if (typeof window === "undefined") return initial;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initial;
    return { ...initial, ...JSON.parse(saved) };
  } catch {
    return initial;
  }
}

export function saveStateToStorage(state: OntwikkelpadenState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
