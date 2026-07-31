import type { Wereld } from "@/lib/data/werelden";
import { sql } from "@/lib/db";
import type { PadId } from "@/types/ontwikkelpaden";

export interface UpsertPlanningInput {
  padId: PadId;
  niveau: number;
  wereld: Wereld;
  nodigNu: number;
  nodigStraks: number;
}

/** Elke ingelogde gebruiker mag de norm-cijfers bijwerken — zelfde (ontbrekende) restrictie als Verbeterplanning. */
export async function upsertPlanningCel(
  userEmail: string,
  input: UpsertPlanningInput,
): Promise<void> {
  await sql`
    INSERT INTO vlootschouw_planning (
      pad_id, niveau, wereld, nodig_nu, nodig_straks, updated_by
    ) VALUES (
      ${input.padId}, ${input.niveau}, ${input.wereld},
      ${input.nodigNu}, ${input.nodigStraks}, ${userEmail}
    )
    ON CONFLICT (pad_id, niveau, wereld) DO UPDATE SET
      nodig_nu = EXCLUDED.nodig_nu,
      nodig_straks = EXCLUDED.nodig_straks,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
  `;
}
