import type { BeoordelaarStatus } from "@/lib/gesprekken-access";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

export type GesprekStatus = "draft" | "completed" | "archived";
export type { BeoordelaarStatus };

export interface Gesprek {
  id: string;
  medewerkerNaam: string;
  medewerkerEmail: string | null;
  wereld: string;
  bijPreconSinds: string;
  gesprekDatum: string | null;
  datumVorig: string | null;
  datumVolgend: string | null;
  hoofdbeoordelaar: string;
  hoofdbeoordelaarStatus: BeoordelaarStatus;
  medebeoordelaar: string;
  medebeoordelaarStatus: BeoordelaarStatus;
  status: GesprekStatus;
  state: OntwikkelpadenState;
  previousGesprekId: string | null;
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
  hoofdbeoordelaarStatus: BeoordelaarStatus;
  medebeoordelaar: string;
  medebeoordelaarStatus: BeoordelaarStatus;
  updatedAt: string;
}

export interface BekendeMedewerker {
  naam: string;
  email: string;
}

export type BeoordelaarRol = "hoofdbeoordelaar" | "medebeoordelaar";

export interface DashboardOverzicht {
  eigen: GesprekListItem[];
  alsHoofdbeoordelaar: GesprekListItem[];
  alsMedebeoordelaar: GesprekListItem[];
  pendingGoedkeuringen: GesprekListItem[];
  /**
   * E-mailadres van wie vraagt om al je verslagen te mogen inzien, los van
   * één specifiek gesprek. Null als er niemand op goedkeuring wacht.
   */
  pendingHoofdbeoordelaar: string | null;
}
