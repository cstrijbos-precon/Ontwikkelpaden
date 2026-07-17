import { sql } from "@/lib/db";
import type { ProjectMonthStatusOrEmpty } from "@/lib/verbeterplanning/constants";
import { MAX_MILESTONES_PER_PROJECT } from "@/lib/verbeterplanning/constants";
import {
  MilestoneLimitError,
  MilestoneNotFoundError,
  ProjectNotFoundError,
} from "@/lib/verbeterplanning/errors";

interface MilestoneRow {
  id: string;
  project_code: string;
  name: string;
}

export interface MilestoneMeta {
  id: string;
  projectCode: string;
  name: string;
}

function mapRow(row: MilestoneRow): MilestoneMeta {
  return { id: row.id, projectCode: row.project_code, name: row.name };
}

export async function createMilestone(
  projectCode: string,
  userEmail: string,
  name: string,
): Promise<MilestoneMeta> {
  const projectRows = (await sql`
    SELECT code FROM verbeterplanning_projects WHERE code = ${projectCode}
  `) as { code: string }[];
  if (projectRows.length === 0) throw new ProjectNotFoundError();

  const countRows = (await sql`
    SELECT COUNT(*)::int AS count, COALESCE(MAX(sort_order), 0) AS max_sort
    FROM verbeterplanning_milestones
    WHERE project_code = ${projectCode}
  `) as { count: number; max_sort: number }[];
  const stats = countRows[0];
  if (stats && stats.count >= MAX_MILESTONES_PER_PROJECT) {
    throw new MilestoneLimitError();
  }

  const rows = (await sql`
    INSERT INTO verbeterplanning_milestones (project_code, name, sort_order, created_by)
    VALUES (${projectCode}, ${name}, ${(stats?.max_sort ?? 0) + 10}, ${userEmail})
    RETURNING id, project_code, name
  `) as MilestoneRow[];

  const row = rows[0];
  if (!row) throw new Error("Failed to create milestone");
  return mapRow(row);
}

export async function renameMilestone(
  id: string,
  name: string,
): Promise<MilestoneMeta> {
  const rows = (await sql`
    UPDATE verbeterplanning_milestones SET
      name = ${name},
      updated_at = now()
    WHERE id = ${id}
    RETURNING id, project_code, name
  `) as MilestoneRow[];

  const row = rows[0];
  if (!row) throw new MilestoneNotFoundError();
  return mapRow(row);
}

export async function deleteMilestone(id: string): Promise<void> {
  const rows = (await sql`
    DELETE FROM verbeterplanning_milestones WHERE id = ${id} RETURNING id
  `) as { id: string }[];
  if (rows.length === 0) throw new MilestoneNotFoundError();
}

export async function setMilestoneMonthStatus(
  id: string,
  userEmail: string,
  monthIndex: number,
  status: ProjectMonthStatusOrEmpty,
): Promise<void> {
  const existing = (await sql`
    SELECT id FROM verbeterplanning_milestones WHERE id = ${id}
  `) as { id: string }[];
  if (existing.length === 0) throw new MilestoneNotFoundError();

  if (status === "") {
    await sql`
      DELETE FROM verbeterplanning_milestone_status
      WHERE milestone_id = ${id} AND month_index = ${monthIndex}
    `;
    return;
  }

  await sql`
    INSERT INTO verbeterplanning_milestone_status (milestone_id, month_index, status, updated_by)
    VALUES (${id}, ${monthIndex}, ${status}, ${userEmail})
    ON CONFLICT (milestone_id, month_index) DO UPDATE SET
      status = EXCLUDED.status,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
  `;
}
