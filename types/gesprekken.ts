import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

export type GesprekStatus = "draft" | "completed" | "archived";

export interface Gesprek {
  id: string;
  medewerkerNaam: string;
  medewerkerEmail: string | null;
  bijPreconSinds: string;
  gesprekDatum: string | null;
  datumVorig: string | null;
  datumVolgend: string | null;
  hoofdbeoordelaar: string;
  medebeoordelaar: string;
  status: GesprekStatus;
  state: OntwikkelpadenState;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GesprekListItem {
  id: string;
  medewerkerNaam: string;
  medewerkerEmail: string | null;
  gesprekDatum: string | null;
  status: GesprekStatus;
  hoofdbeoordelaar: string;
  updatedAt: string;
}
