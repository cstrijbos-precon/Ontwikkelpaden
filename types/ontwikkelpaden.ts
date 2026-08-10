export type PadId = "vakexpert" | "adviseur" | "leider" | "trainer";
export type CompId = "b" | "k" | "o" | "org" | "t";

export interface Scherm {
  id: string;
  label: string;
  fase: "gesprek" | "pop";
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

export interface Reflectie {
  id: string;
  datum: string;
  tekst: string;
}

export interface OntwikkelpadenState {
  naam: string;
  wereld: string;
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
  /** Handmatig verschoven niveau per pad; null = volg de berekening. */
  niveauCorrectie: Record<PadId, number | null>;
  /** Verplichte toelichting zodra een niveau handmatig is verschoven. */
  niveauCorrectieToelichting: string;
  ambities: Record<PadId, boolean>;
  trainingsgroepen: Record<PadId, string>;
  ambitieNotitie: string;
  niveauInschaling: string;
  toolboxKeuze: string;
  checkpoints: string;
  tProfielOntwikkeling: string;
  trainingslijnLeren: string;
  overigeAfspraken: string;
  datumVolgend: string;
  reflecties: Reflectie[];
  akkoordProfessional: boolean;
  akkoordProfessionalNaam: string;
  akkoordProfessionalAt: string;
  akkoordHoofdbeoordelaar: boolean;
  akkoordHoofdbeoordelaarNaam: string;
  akkoordHoofdbeoordelaarAt: string;
  akkoordMedebeoordelaar: boolean;
  akkoordMedebeoordelaarNaam: string;
  akkoordMedebeoordelaarAt: string;
}
