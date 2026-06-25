import { PADEN } from "@/lib/data/paden";
import type { PadId, Trainingsgroep } from "@/types/ontwikkelpaden";

export const TRAININGSGROEPEN: Record<PadId, Trainingsgroep[]> = Object.fromEntries(
  (Object.keys(PADEN) as PadId[]).map((pad) => {
    const padData = PADEN[pad];
    const groepen: Trainingsgroep[] = [];
    for (let v = 1; v <= 4; v++) {
      groepen.push({
        id: `${pad}-${v}-${v + 1}`,
        label: `${padData.label} ${v}→${v + 1}: ${padData.rollen[v - 1]} naar ${padData.rollen[v]}`,
      });
    }
    return [pad, groepen];
  }),
) as Record<PadId, Trainingsgroep[]>;
