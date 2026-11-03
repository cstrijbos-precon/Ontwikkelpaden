import { COMPS } from "@/lib/data/competenties";
import { PAD_IDS, PADEN } from "@/lib/data/paden";
import { PAD_IDS_SUPPORT, PADEN_SUPPORT } from "@/lib/data/paden-support";
import type { Competentie, Pad, PadId } from "@/types/ontwikkelpaden";

/**
 * Support werkt met een eigen ontwikkelpadengids (A-06-2) en een eigen
 * formulier (F-19). Welke variant iemand gebruikt, volgt uit de wereld waar
 * die persoon in zit: wie bij Support werkt, krijgt de Support-paden.
 *
 * Pure functies zonder database, zodat ook client components ze kunnen
 * importeren.
 */
export type Variant = "standaard" | "support";

export const SUPPORT_WERELD = "Support";

export function variantVan(wereld: string): Variant {
  return wereld === SUPPORT_WERELD ? "support" : "standaard";
}

export function padenVoor(variant: Variant): Record<PadId, Pad> {
  return variant === "support" ? PADEN_SUPPORT : PADEN;
}

/** De paden die in deze variant bestaan, in weergavevolgorde. */
export function padIdsVoor(variant: Variant): PadId[] {
  return variant === "support" ? PAD_IDS_SUPPORT : PAD_IDS;
}

/** De competenties van deze variant: Support kent geen Training en coaching. */
export function compsVoor(variant: Variant): Competentie[] {
  return variant === "support" ? COMPS.filter((c) => c.id !== "t") : COMPS;
}

/** Hoeveel niveaus heeft dit pad in deze variant? */
export function aantalNiveaus(variant: Variant, padId: PadId): number {
  return padenVoor(variant)[padId].rollen.length;
}
