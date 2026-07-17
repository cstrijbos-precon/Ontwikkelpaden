import { sql } from "@/lib/db";
import type {
  ProjectMonthStatusOrEmpty,
  Resultaatgebied,
} from "@/lib/verbeterplanning/constants";
import {
  ProjectCodeExistsError,
  ProjectNotFoundError,
} from "@/lib/verbeterplanning/errors";

interface ProjectMetaRow {
  code: string;
  title: string;
  mtlid: string;
  trekker: string;
  team: string;
  rg: string;
  kpi: string;
  group: Resultaatgebied;
}

export interface ProjectMeta {
  code: string;
  title: string;
  mtlid: string;
  trekker: string;
  team: string;
  rg: string;
  kpi: string;
  group: Resultaatgebied;
}

function mapRow(row: ProjectMetaRow): ProjectMeta {
  return {
    code: row.code,
    title: row.title,
    mtlid: row.mtlid,
    trekker: row.trekker,
    team: row.team,
    rg: row.rg,
    kpi: row.kpi,
    group: row.group,
  };
}

export interface CreateProjectInput {
  code: string;
  title: string;
  mtlid?: string;
  trekker?: string;
  team?: string;
  rg?: string;
  kpi?: string;
  group: Resultaatgebied;
}

export async function createProject(
  userEmail: string,
  input: CreateProjectInput,
): Promise<ProjectMeta> {
  const existing = (await sql`
    SELECT code FROM verbeterplanning_projects WHERE code = ${input.code}
  `) as { code: string }[];
  if (existing.length > 0) {
    throw new ProjectCodeExistsError(input.code);
  }

  const maxSortRows = (await sql`
    SELECT COALESCE(MAX(sort_order), 0) AS max_sort
    FROM verbeterplanning_projects
    WHERE "group" = ${input.group}
  `) as { max_sort: number }[];
  const nextSortOrder = (maxSortRows[0]?.max_sort ?? 0) + 10;

  const rows = (await sql`
    INSERT INTO verbeterplanning_projects (
      code, title, mtlid, trekker, team, rg, kpi, "group", sort_order, created_by, updated_by
    ) VALUES (
      ${input.code},
      ${input.title},
      ${input.mtlid ?? ""},
      ${input.trekker ?? ""},
      ${input.team ?? ""},
      ${input.rg ?? ""},
      ${input.kpi ?? ""},
      ${input.group},
      ${nextSortOrder},
      ${userEmail},
      ${userEmail}
    )
    RETURNING code, title, mtlid, trekker, team, rg, kpi, "group"
  `) as ProjectMetaRow[];

  const row = rows[0];
  if (!row) throw new Error("Failed to create project");
  return mapRow(row);
}

export interface UpdateProjectMetaInput {
  title?: string;
  mtlid?: string;
  trekker?: string;
  team?: string;
  rg?: string;
  kpi?: string;
}

export async function updateProjectMeta(
  code: string,
  userEmail: string,
  patch: UpdateProjectMetaInput,
): Promise<ProjectMeta> {
  const existingRows = (await sql`
    SELECT code, title, mtlid, trekker, team, rg, kpi, "group" FROM verbeterplanning_projects WHERE code = ${code}
  `) as ProjectMetaRow[];
  const existing = existingRows[0];
  if (!existing) throw new ProjectNotFoundError();

  const next = {
    title: patch.title ?? existing.title,
    mtlid: patch.mtlid ?? existing.mtlid,
    trekker: patch.trekker ?? existing.trekker,
    team: patch.team ?? existing.team,
    rg: patch.rg ?? existing.rg,
    kpi: patch.kpi ?? existing.kpi,
  };

  const rows = (await sql`
    UPDATE verbeterplanning_projects SET
      title = ${next.title},
      mtlid = ${next.mtlid},
      trekker = ${next.trekker},
      team = ${next.team},
      rg = ${next.rg},
      kpi = ${next.kpi},
      updated_by = ${userEmail},
      updated_at = now()
    WHERE code = ${code}
    RETURNING code, title, mtlid, trekker, team, rg, kpi, "group"
  `) as ProjectMetaRow[];

  const row = rows[0];
  if (!row) throw new ProjectNotFoundError();
  return mapRow(row);
}

export async function setProjectMonthStatus(
  code: string,
  userEmail: string,
  monthIndex: number,
  status: ProjectMonthStatusOrEmpty,
): Promise<void> {
  const existing = (await sql`
    SELECT code FROM verbeterplanning_projects WHERE code = ${code}
  `) as { code: string }[];
  if (existing.length === 0) throw new ProjectNotFoundError();

  if (status === "") {
    await sql`
      DELETE FROM verbeterplanning_project_status
      WHERE project_code = ${code} AND month_index = ${monthIndex}
    `;
    return;
  }

  await sql`
    INSERT INTO verbeterplanning_project_status (project_code, month_index, status, updated_by)
    VALUES (${code}, ${monthIndex}, ${status}, ${userEmail})
    ON CONFLICT (project_code, month_index) DO UPDATE SET
      status = EXCLUDED.status,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
  `;
}
