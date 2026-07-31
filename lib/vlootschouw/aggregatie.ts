import { PAD_IDS } from "@/lib/data/paden";
import { WERELDEN } from "@/lib/data/werelden";
import type { PadWereldOverzicht, RolRij } from "@/lib/vlootschouw/types";

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
