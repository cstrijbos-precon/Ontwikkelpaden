import { sql } from "@/lib/db";
import {
  type KpiQuarterStatusOrEmpty,
  type KpiType,
  MAX_KPIS_PER_PROJECT,
} from "@/lib/verbeterplanning/constants";
import {
  KpiLimitError,
  KpiNotFoundError,
  ProjectNotFoundError,
} from "@/lib/verbeterplanning/errors";

interface KpiRow {
  id: string;
  project_code: string;
  type: KpiType;
  description: string;
}

export interface KpiMeta {
  id: string;
  projectCode: string;
  type: KpiType;
  description: string;
}

function mapRow(row: KpiRow): KpiMeta {
  return {
    id: row.id,
    projectCode: row.project_code,
    type: row.type,
    description: row.description,
  };
}

export async function createKpi(
  projectCode: string,
  userEmail: string,
  type: KpiType,
  description: string,
): Promise<KpiMeta> {
  const projectRows = (await sql`
    SELECT code FROM verbeterplanning_projects WHERE code = ${projectCode}
  `) as { code: string }[];
  if (projectRows.length === 0) throw new ProjectNotFoundError();

  const countRows = (await sql`
    SELECT COUNT(*)::int AS count, COALESCE(MAX(sort_order), 0) AS max_sort
    FROM verbeterplanning_kpis
    WHERE project_code = ${projectCode}
  `) as { count: number; max_sort: number }[];
  const stats = countRows[0];
  if (stats && stats.count >= MAX_KPIS_PER_PROJECT) {
    throw new KpiLimitError();
  }

  const rows = (await sql`
    INSERT INTO verbeterplanning_kpis (project_code, type, description, sort_order, created_by)
    VALUES (${projectCode}, ${type}, ${description}, ${(stats?.max_sort ?? 0) + 10}, ${userEmail})
    RETURNING id, project_code, type, description
  `) as KpiRow[];

  const row = rows[0];
  if (!row) throw new Error("Failed to create kpi");
  return mapRow(row);
}

export interface UpdateKpiInput {
  type?: KpiType;
  description?: string;
}

export async function updateKpi(
  id: string,
  patch: UpdateKpiInput,
): Promise<KpiMeta> {
  const existingRows = (await sql`
    SELECT id, project_code, type, description FROM verbeterplanning_kpis WHERE id = ${id}
  `) as KpiRow[];
  const existing = existingRows[0];
  if (!existing) throw new KpiNotFoundError();

  const next = {
    type: patch.type ?? existing.type,
    description: patch.description ?? existing.description,
  };

  const rows = (await sql`
    UPDATE verbeterplanning_kpis SET
      type = ${next.type},
      description = ${next.description},
      updated_at = now()
    WHERE id = ${id}
    RETURNING id, project_code, type, description
  `) as KpiRow[];

  const row = rows[0];
  if (!row) throw new KpiNotFoundError();
  return mapRow(row);
}

export async function deleteKpi(id: string): Promise<void> {
  const rows = (await sql`
    DELETE FROM verbeterplanning_kpis WHERE id = ${id} RETURNING id
  `) as { id: string }[];
  if (rows.length === 0) throw new KpiNotFoundError();
}

async function ensureKpiExists(id: string): Promise<void> {
  const rows =
    (await sql`SELECT id FROM verbeterplanning_kpis WHERE id = ${id}`) as {
      id: string;
    }[];
  if (rows.length === 0) throw new KpiNotFoundError();
}

export async function setKpiQuarterStatus(
  id: string,
  userEmail: string,
  quarterIndex: number,
  status: KpiQuarterStatusOrEmpty,
): Promise<void> {
  await ensureKpiExists(id);

  if (status === "") {
    await sql`
      DELETE FROM verbeterplanning_kpi_quarter_status
      WHERE kpi_id = ${id} AND quarter_index = ${quarterIndex}
    `;
    return;
  }

  await sql`
    INSERT INTO verbeterplanning_kpi_quarter_status (kpi_id, quarter_index, status, updated_by)
    VALUES (${id}, ${quarterIndex}, ${status}, ${userEmail})
    ON CONFLICT (kpi_id, quarter_index) DO UPDATE SET
      status = EXCLUDED.status,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
  `;
}

export async function setKpiQuarterNote(
  id: string,
  userEmail: string,
  quarterIndex: number,
  note: string,
): Promise<void> {
  await ensureKpiExists(id);

  if (note === "") {
    await sql`
      DELETE FROM verbeterplanning_kpi_quarter_notes
      WHERE kpi_id = ${id} AND quarter_index = ${quarterIndex}
    `;
    return;
  }

  await sql`
    INSERT INTO verbeterplanning_kpi_quarter_notes (kpi_id, quarter_index, note, updated_by)
    VALUES (${id}, ${quarterIndex}, ${note}, ${userEmail})
    ON CONFLICT (kpi_id, quarter_index) DO UPDATE SET
      note = EXCLUDED.note,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
  `;
}
