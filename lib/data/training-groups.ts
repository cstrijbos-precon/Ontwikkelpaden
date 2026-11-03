import { padenVoor, type Variant } from "@/lib/variant";
import type { PadId, Trainingsgroep } from "@/types/ontwikkelpaden";

/** Eén trainingsgroep per stap omhoog, dus één minder dan er niveaus zijn. */
export function trainingsgroepenVoor(
  variant: Variant,
): Record<PadId, Trainingsgroep[]> {
  const paden = padenVoor(variant);
  return Object.fromEntries(
    (Object.keys(paden) as PadId[]).map((pad) => {
      const padData = paden[pad];
      const groepen: Trainingsgroep[] = [];
      for (let v = 1; v < padData.rollen.length; v++) {
        groepen.push({
          id: `${pad}-${v}-${v + 1}`,
          label: `${padData.label} ${v}→${v + 1}: ${padData.rollen[v - 1]} naar ${padData.rollen[v]}`,
        });
      }
      return [pad, groepen];
    }),
  ) as Record<PadId, Trainingsgroep[]>;
}

export const TRAININGSGROEPEN = trainingsgroepenVoor("standaard");
