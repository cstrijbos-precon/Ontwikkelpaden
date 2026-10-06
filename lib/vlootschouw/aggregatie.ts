import { PAD_IDS } from "@/lib/data/paden";
import { WERELDEN, type Wereld } from "@/lib/data/werelden";
import type { PadWereldOverzicht, RolRij } from "@/lib/vlootschouw/types";
import type { PadId } from "@/types/ontwikkelpaden";

/**
 * Puur/client-veilig: bevat GEEN import van lib/db of andere server-only
 * code, zodat dit bestand ook vanuit client components ("use client")
 * geïmporteerd kan worden zonder de databaseverbinding in de browserbundel
 * te trekken.
 */

/** Aggregeert de rol-rijen naar één totaal per (pad, wereld) — voor het percentage-overzicht. */
export function groepeerPerPadEnWereld(rollen: RolRij[]): PadWereldOverzicht[] {
  const resultaat: PadWereldOverzicht[] = [];

  for (const padId of PAD_IDS) {
    for (const wereld of WERELDEN) {
      const rijen = rollen.filter(
        (r) => r.padId === padId && r.wereld === wereld,
      );
      if (rijen.length === 0) continue;

      const aanwezig = rijen.reduce((sum, r) => sum + r.aanwezig, 0);
      const nodigNu = rijen.reduce((sum, r) => sum + r.nodigNu, 0);
      const nodigStraks = rijen.reduce((sum, r) => sum + r.nodigStraks, 0);
      resultaat.push({
        padId,
        wereld,
        aanwezig,
        nodigNu,
        nodigStraks,
        vervullingPercentage:
          nodigNu > 0 ? Math.round((aanwezig / nodigNu) * 100) : null,
      });
    }
  }

  return resultaat;
}

export type WereldFilter = Wereld | "totaal";

export interface Aantallen {
  aanwezig: number;
  nodigNu: number;
  nodigStraks: number;
}

function somVan(rijen: RolRij[]): Aantallen {
  return {
    aanwezig: rijen.reduce((sum, r) => sum + r.aanwezig, 0),
    nodigNu: rijen.reduce((sum, r) => sum + r.nodigNu, 0),
    nodigStraks: rijen.reduce((sum, r) => sum + r.nodigStraks, 0),
  };
}

function inFilter(rij: RolRij, filter: WereldFilter): boolean {
  return filter === "totaal" || rij.wereld === filter;
}

/** Aantallen voor één positie op het pad (pad × niveau), over de gekozen wereld(en). */
export function somPerCel(
  rollen: RolRij[],
  padId: PadId,
  niveau: number,
  filter: WereldFilter,
): Aantallen {
  return somVan(
    rollen.filter(
      (r) => r.padId === padId && r.niveau === niveau && inFilter(r, filter),
    ),
  );
}

/** Aantallen voor een heel pad, over de gekozen wereld(en). */
export function somPerPad(
  rollen: RolRij[],
  padId: PadId,
  filter: WereldFilter,
): Aantallen {
  return somVan(rollen.filter((r) => r.padId === padId && inFilter(r, filter)));
}

export type VervullingSoort =
  | "geen-norm"
  | "tekort"
  | "op-sterkte"
  | "overschot";

/**
 * Hoe staat het aantal aanwezigen ten opzichte van wat er nu nodig is?
 * Zonder norm (nodig nu = 0) valt er niets te vergelijken.
 */
export function vervullingStatus(
  aanwezig: number,
  nodigNu: number,
): { soort: VervullingSoort; verschil: number } {
  if (nodigNu <= 0) return { soort: "geen-norm", verschil: 0 };
  const verschil = aanwezig - nodigNu;
  if (verschil < 0) return { soort: "tekort", verschil };
  if (verschil === 0) return { soort: "op-sterkte", verschil };
  return { soort: "overschot", verschil };
}
