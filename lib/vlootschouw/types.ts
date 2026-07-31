import type { Wereld } from "@/lib/data/werelden";
import type { PadId } from "@/types/ontwikkelpaden";

export type VennCategorie =
  | "key-players"
  | "wachtkamer"
  | "zorgenkindjes"
  | "huidige-kern"
  | "tijdelijke-krachten"
  | "most-wanted"
  | "toekomstig-talent"
  | "geen-data";

export interface RolRij {
  padId: PadId;
  niveau: number;
  rolNaam: string;
  wereld: Wereld;
  aanwezig: number;
  nodigNu: number;
  nodigStraks: number;
}

export interface PadOverzicht {
  padId: PadId;
  aanwezig: number;
  nodigNu: number;
  nodigStraks: number;
  vervullingPercentage: number | null;
  vennCategorie: VennCategorie;
}

export interface PadWereldOverzicht {
  padId: PadId;
  wereld: Wereld;
  aanwezig: number;
  nodigNu: number;
  nodigStraks: number;
  vervullingPercentage: number | null;
}

export interface VlootschouwOverzicht {
  paden: PadOverzicht[];
  rollen: RolRij[];
}
