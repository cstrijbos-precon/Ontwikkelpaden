export type PadId = "vakexpert" | "adviseur" | "leider" | "trainer";
export type CompId = "b" | "k" | "o" | "org" | "t";

export interface Scherm {
  id: string;
  label: string;
}

export interface Vereisten {
  b: number;
  k: number;
  o: number;
  org: number;
  t?: number;
}

export interface Toolbox {
  vereist: string[];
  zelfDoen: string[];
  systemen: string[];
  collega: string[];
  trainingen: string[];
}

export interface Pad {
  label: string;
  kleur: PadId;
  rollen: string[];
  vereisten: Vereisten[];
  toolboxen: Record<number, Toolbox>;
}

export interface Ster {
  label: string;
  sym: string;
  intro: string;
  kaderTitel: string;
  gedrag: string[];
}

export interface Competentie {
  id: CompId;
  label: string;
  definitie: string;
  kernwoorden: string[];
  sterren: Ster[];
  trainerOnly?: boolean;
}

export interface Trainingsgroep {
  id: string;
  label: string;
}

export interface OntwikkelpadenState {
  naam: string;
  bijPreconSinds: string;
  datum: string;
  datumVorig: string;
  hoofdbeoordelaar: string;
  medebeoordelaar: string;
  hoeGaatHet: string;
  werkdruk: string;
  kernwaarden: string;
  situaties: string[];
  impact: string;
  declarabiliteit: string;
  afspraken: string;
  checks: string;
  profiel: string;
  scores: Record<CompId, number>;
  opmerkingen: Record<CompId, string>;
  tCellen: string[];
  tDiepte: string;
  tBreedte: string;
  vorigJaar: Record<PadId, number>;
  ambities: Record<PadId, boolean>;
  trainingsgroepen: Record<PadId, string>;
  ambitieNotitie: string;
  toolboxKeuze: string;
  checkpoints: string;
  tProfielOntwikkeling: string;
  overigeAfspraken: string;
  datumVolgend: string;
}
