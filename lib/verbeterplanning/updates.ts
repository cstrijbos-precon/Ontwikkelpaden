import { sql } from "@/lib/db";
import {
  ProjectNotFoundError,
  UpdateNotFoundError,
} from "@/lib/verbeterplanning/errors";
import type { Update } from "@/lib/verbeterplanning/types";

interface UpdateRow {
  id: string;
  text: string;
  created_by: string;
  created_at: string;
}

function mapRow(row: UpdateRow): Update {
  return {
    id: row.id,
    text: row.text,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function createUpdate(
  projectCode: string,
  userEmail: string,
  text: string,
): Promise<Update> {
  const projectRows = (await sql`
    SELECT code FROM verbeterplanning_projects WHERE code = ${projectCode}
  `) as { code: string }[];
  if (projectRows.length === 0) throw new ProjectNotFoundError();

  const rows = (await sql`
    INSERT INTO verbeterplanning_updates (project_code, text, created_by)
    VALUES (${projectCode}, ${text}, ${userEmail})
    RETURNING id, text, created_by, created_at
  `) as UpdateRow[];

  const row = rows[0];
  if (!row) throw new Error("Failed to create update");
  return mapRow(row);
}

export async function editUpdate(id: string, text: string): Promise<Update> {
  const rows = (await sql`
    UPDATE verbeterplanning_updates SET
      text = ${text},
      updated_at = now()
    WHERE id = ${id}
    RETURNING id, text, created_by, created_at
  `) as UpdateRow[];

  const row = rows[0];
  if (!row) throw new UpdateNotFoundError();
  return mapRow(row);
}

export async function deleteUpdate(id: string): Promise<void> {
  const rows = (await sql`
    DELETE FROM verbeterplanning_updates WHERE id = ${id} RETURNING id
  `) as { id: string }[];
  if (rows.length === 0) throw new UpdateNotFoundError();
}
