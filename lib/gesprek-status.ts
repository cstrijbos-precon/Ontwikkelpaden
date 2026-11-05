import type { GesprekStatus } from "@/types/gesprekken";

/** Professional, hoofdbeoordelaar en medebeoordelaar tekenen alle drie. */
export const AANTAL_ONDERTEKENAARS = 3;

/**
 * Wat laat het dashboard zien achter de naam? Een concept dat al
 * handtekeningen heeft, is geen concept meer: het wacht op de rest. Zonder dit
 * onderscheid ziet een gesprek waar nog maar één handtekening aan ontbreekt er
 * hetzelfde uit als een leeg begin.
 */
export function statusWeergave(
  status: GesprekStatus,
  aantalGetekend: number,
): { label: string; soort: "concept" | "ondertekenen" | "klaar" | "archief" } {
  if (status === "completed") return { label: "Afgerond", soort: "klaar" };
  if (status === "archived") return { label: "Gearchiveerd", soort: "archief" };
  if (aantalGetekend > 0) {
    return {
      label: `Wacht op ondertekening (${aantalGetekend} van ${AANTAL_ONDERTEKENAARS})`,
      soort: "ondertekenen",
    };
  }
  return { label: "Concept", soort: "concept" };
}
