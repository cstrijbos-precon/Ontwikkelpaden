import { PAD_IDS, PADEN } from "@/lib/data/paden";
import type { Wereld } from "@/lib/data/werelden";
import { WERELDEN } from "@/lib/data/werelden";
import { sql } from "@/lib/db";
import type {
  PadOverzicht,
  RolRij,
  VennCategorie,
  VlootschouwOverzicht,
} from "@/lib/vlootschouw/types";
import type { PadId } from "@/types/ontwikkelpaden";

interface AanwezigRow {
  pad_id: PadId;
  wereld: Wereld;
  huidig_niveau: number;
  aantal: number;
}

interface PlanningRow {
  pad_id: PadId;
  niveau: number;
  wereld: Wereld;
  nodig_nu: number;
  nodig_straks: number;
}

/**
 * De 7 Venn-categorieën uit de vlootschouw-praatplaat: welke van de drie
 * verzamelingen (nu aanwezig / nu nodig / straks nodig) een pad raakt bepaalt
 * het vakje. "geen-data" is geen onderdeel van het diagram — dat betekent dat
 * er voor dit pad nog helemaal niets bekend is.
 */
export function classificeerPad(
  aanwezig: number,
  nodigNu: number,
  nodigStraks: number,
): VennCategorie {
  const heeftAanwezig = aanwezig > 0;
  const heeftNu = nodigNu > 0;
  const heeftStraks = nodigStraks > 0;

  if (heeftAanwezig && heeftNu && heeftStraks) return "key-players";
  if (heeftAanwezig && heeftStraks && !heeftNu) return "wachtkamer";
  if (heeftAanwezig && !heeftNu && !heeftStraks) return "zorgenkindjes";
  if (heeftAanwezig && heeftNu && !heeftStraks) return "huidige-kern";
  if (!heeftAanwezig && heeftNu && !heeftStraks) return "tijdelijke-krachten";
  if (!heeftAanwezig && heeftNu && heeftStraks) return "most-wanted";
  if (!heeftAanwezig && !heeftNu && heeftStraks) return "toekomstig-talent";
  return "geen-data";
}

function rolKey(padId: string, niveau: number, wereld: string): string {
  return `${padId}|${niveau}|${wereld}`;
}

export async function getVlootschouwOverzicht(): Promise<VlootschouwOverzicht> {
  const aanwezigRows = (await sql`
    SELECT gp.pad_id, g.wereld, gp.huidig_niveau, COUNT(*)::int AS aantal
    FROM gesprekken g
    JOIN gesprek_paden gp ON gp.gesprek_id = g.id
    WHERE g.status != 'archived' AND gp.huidig_niveau > 0 AND g.wereld != ''
    GROUP BY gp.pad_id, g.wereld, gp.huidig_niveau
  `) as AanwezigRow[];

  const planningRows = (await sql`
    SELECT pad_id, niveau, wereld, nodig_nu, nodig_straks FROM vlootschouw_planning
  `) as PlanningRow[];

  const rijMap = new Map<string, RolRij>();
  function rij(padId: PadId, niveau: number, wereld: Wereld): RolRij {
    const k = rolKey(padId, niveau, wereld);
    let bestaand = rijMap.get(k);
    if (!bestaand) {
      bestaand = {
        padId,
        niveau,
        rolNaam: PADEN[padId].rollen[niveau - 1] ?? "",
        wereld,
        aanwezig: 0,
        nodigNu: 0,
        nodigStraks: 0,
      };
      rijMap.set(k, bestaand);
    }
    return bestaand;
  }

  // Alle (pad, niveau, wereld)-combinaties alvast aanmaken, zodat elke cel
  // ook zonder bestaande data invulbaar is in de detailtabel.
  for (const padId of PAD_IDS) {
    for (let niveau = 1; niveau <= 5; niveau++) {
      for (const wereld of WERELDEN) {
        rij(padId, niveau, wereld);
      }
    }
  }

  for (const row of aanwezigRows) {
    rij(row.pad_id, row.huidig_niveau, row.wereld).aanwezig = row.aantal;
  }
  for (const row of planningRows) {
    const r = rij(row.pad_id, row.niveau, row.wereld);
    r.nodigNu = row.nodig_nu;
    r.nodigStraks = row.nodig_straks;
  }

  const rollen = [...rijMap.values()].sort((a, b) => {
    if (a.padId !== b.padId) {
      return PAD_IDS.indexOf(a.padId) - PAD_IDS.indexOf(b.padId);
    }
    if (a.niveau !== b.niveau) return a.niveau - b.niveau;
    return a.wereld.localeCompare(b.wereld);
  });

  const paden: PadOverzicht[] = PAD_IDS.map((padId) => {
    const rijenVoorPad = rollen.filter((r) => r.padId === padId);
    const aanwezig = rijenVoorPad.reduce((sum, r) => sum + r.aanwezig, 0);
    const nodigNu = rijenVoorPad.reduce((sum, r) => sum + r.nodigNu, 0);
    const nodigStraks = rijenVoorPad.reduce((sum, r) => sum + r.nodigStraks, 0);
    return {
      padId,
      aanwezig,
      nodigNu,
      nodigStraks,
      vervullingPercentage:
        nodigNu > 0 ? Math.round((aanwezig / nodigNu) * 100) : null,
      vennCategorie: classificeerPad(aanwezig, nodigNu, nodigStraks),
    };
  });

  return { paden, rollen };
}
