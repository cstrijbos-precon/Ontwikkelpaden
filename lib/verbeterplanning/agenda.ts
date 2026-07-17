import { sql } from "@/lib/db";
import type { AgendaEntry } from "@/lib/verbeterplanning/types";

interface AgendaRow {
  month_index: number;
  datum: string;
  projecten: string;
  opmerkingen: string;
}

export interface SetAgendaFieldInput {
  datum?: string;
  projecten?: string;
  opmerkingen?: string;
}

export async function setAgendaField(
  monthIndex: number,
  userEmail: string,
  patch: SetAgendaFieldInput,
): Promise<AgendaEntry> {
  const existingRows = (await sql`
    SELECT month_index, datum, projecten, opmerkingen
    FROM verbeterplanning_agenda WHERE month_index = ${monthIndex}
  `) as AgendaRow[];
  const existing = existingRows[0];

  const next = {
    datum: patch.datum ?? existing?.datum ?? "",
    projecten: patch.projecten ?? existing?.projecten ?? "",
    opmerkingen: patch.opmerkingen ?? existing?.opmerkingen ?? "",
  };

  const rows = (await sql`
    INSERT INTO verbeterplanning_agenda (month_index, datum, projecten, opmerkingen, updated_by)
    VALUES (${monthIndex}, ${next.datum}, ${next.projecten}, ${next.opmerkingen}, ${userEmail})
    ON CONFLICT (month_index) DO UPDATE SET
      datum = EXCLUDED.datum,
      projecten = EXCLUDED.projecten,
      opmerkingen = EXCLUDED.opmerkingen,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
    RETURNING month_index, datum, projecten, opmerkingen
  `) as AgendaRow[];

  const row = rows[0];
  if (!row) throw new Error("Failed to save agenda entry");
  return {
    monthIndex: row.month_index,
    datum: row.datum,
    projecten: row.projecten,
    opmerkingen: row.opmerkingen,
  };
}
