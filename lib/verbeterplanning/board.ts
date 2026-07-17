import { sql } from "@/lib/db";
import {
  AGENDA_MONTHS,
  KPI_QUARTERS,
  type KpiQuarterStatusOrEmpty,
  type KpiType,
  MONTHS,
  type ProjectMonthStatusOrEmpty,
  type Resultaatgebied,
} from "@/lib/verbeterplanning/constants";
import type {
  AgendaEntry,
  Kpi,
  Milestone,
  Project,
  Update,
  VerbeterplanningBoard,
} from "@/lib/verbeterplanning/types";

interface ProjectRow {
  code: string;
  title: string;
  mtlid: string;
  trekker: string;
  team: string;
  rg: string;
  kpi: string;
  group: Resultaatgebied;
}
interface StatusRow {
  project_code: string;
  month_index: number;
  status: ProjectMonthStatusOrEmpty;
}
interface MilestoneRow {
  id: string;
  project_code: string;
  name: string;
}
interface MilestoneStatusRow {
  milestone_id: string;
  month_index: number;
  status: ProjectMonthStatusOrEmpty;
}
interface KpiRow {
  id: string;
  project_code: string;
  type: KpiType;
  description: string;
}
interface KpiStatusRow {
  kpi_id: string;
  quarter_index: number;
  status: KpiQuarterStatusOrEmpty;
}
interface KpiNoteRow {
  kpi_id: string;
  quarter_index: number;
  note: string;
}
interface UpdateRow {
  id: string;
  project_code: string;
  text: string;
  created_by: string;
  created_at: string;
}
interface AgendaRow {
  month_index: number;
  datum: string;
  projecten: string;
  opmerkingen: string;
}

function emptyArray<T>(length: number, value: T): T[] {
  return new Array<T>(length).fill(value);
}

export async function getBoard(): Promise<VerbeterplanningBoard> {
  const [
    projectRows,
    statusRows,
    milestoneRows,
    milestoneStatusRows,
    kpiRows,
    kpiStatusRows,
    kpiNoteRows,
    updateRows,
    agendaRows,
  ] = (await Promise.all([
    sql`SELECT code, title, mtlid, trekker, team, rg, kpi, "group" FROM verbeterplanning_projects ORDER BY "group", sort_order`,
    sql`SELECT project_code, month_index, status FROM verbeterplanning_project_status`,
    sql`SELECT id, project_code, name FROM verbeterplanning_milestones ORDER BY sort_order`,
    sql`SELECT milestone_id, month_index, status FROM verbeterplanning_milestone_status`,
    sql`SELECT id, project_code, type, description FROM verbeterplanning_kpis ORDER BY sort_order`,
    sql`SELECT kpi_id, quarter_index, status FROM verbeterplanning_kpi_quarter_status`,
    sql`SELECT kpi_id, quarter_index, note FROM verbeterplanning_kpi_quarter_notes`,
    sql`SELECT id, project_code, text, created_by, created_at FROM verbeterplanning_updates ORDER BY created_at DESC`,
    sql`SELECT month_index, datum, projecten, opmerkingen FROM verbeterplanning_agenda`,
  ])) as [
    ProjectRow[],
    StatusRow[],
    MilestoneRow[],
    MilestoneStatusRow[],
    KpiRow[],
    KpiStatusRow[],
    KpiNoteRow[],
    UpdateRow[],
    AgendaRow[],
  ];

  const statusByProject = new Map<string, ProjectMonthStatusOrEmpty[]>();
  for (const row of statusRows) {
    const arr =
      statusByProject.get(row.project_code) ??
      emptyArray(MONTHS.length, "" as ProjectMonthStatusOrEmpty);
    arr[row.month_index] = row.status;
    statusByProject.set(row.project_code, arr);
  }

  const milestoneStatusById = new Map<string, ProjectMonthStatusOrEmpty[]>();
  for (const row of milestoneStatusRows) {
    const arr =
      milestoneStatusById.get(row.milestone_id) ??
      emptyArray(MONTHS.length, "" as ProjectMonthStatusOrEmpty);
    arr[row.month_index] = row.status;
    milestoneStatusById.set(row.milestone_id, arr);
  }

  const milestonesByProject = new Map<string, Milestone[]>();
  for (const row of milestoneRows) {
    const list = milestonesByProject.get(row.project_code) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      statuses:
        milestoneStatusById.get(row.id) ??
        emptyArray(MONTHS.length, "" as ProjectMonthStatusOrEmpty),
    });
    milestonesByProject.set(row.project_code, list);
  }

  const kpiQuartersById = new Map<
    string,
    { status: KpiQuarterStatusOrEmpty; note: string }[]
  >();
  function ensureKpiQuarters(kpiId: string) {
    const existing = kpiQuartersById.get(kpiId);
    if (existing) return existing;
    const created = emptyArray(
      KPI_QUARTERS.length,
      "" as KpiQuarterStatusOrEmpty,
    ).map((status) => ({
      status,
      note: "",
    }));
    kpiQuartersById.set(kpiId, created);
    return created;
  }
  for (const row of kpiStatusRows) {
    const quarters = ensureKpiQuarters(row.kpi_id);
    const cell = quarters[row.quarter_index];
    if (cell) cell.status = row.status;
  }
  for (const row of kpiNoteRows) {
    const quarters = ensureKpiQuarters(row.kpi_id);
    const cell = quarters[row.quarter_index];
    if (cell) cell.note = row.note;
  }

  const kpisByProject = new Map<string, Kpi[]>();
  for (const row of kpiRows) {
    const list = kpisByProject.get(row.project_code) ?? [];
    list.push({
      id: row.id,
      type: row.type,
      description: row.description,
      quarters: ensureKpiQuarters(row.id),
    });
    kpisByProject.set(row.project_code, list);
  }

  const updatesByProject = new Map<string, Update[]>();
  for (const row of updateRows) {
    const list = updatesByProject.get(row.project_code) ?? [];
    list.push({
      id: row.id,
      text: row.text,
      createdBy: row.created_by,
      createdAt: row.created_at,
    });
    updatesByProject.set(row.project_code, list);
  }

  const projects: Project[] = projectRows.map((row) => ({
    code: row.code,
    title: row.title,
    mtlid: row.mtlid,
    trekker: row.trekker,
    team: row.team,
    rg: row.rg,
    kpi: row.kpi,
    group: row.group,
    statuses:
      statusByProject.get(row.code) ??
      emptyArray(MONTHS.length, "" as ProjectMonthStatusOrEmpty),
    milestones: milestonesByProject.get(row.code) ?? [],
    kpis: kpisByProject.get(row.code) ?? [],
    updates: updatesByProject.get(row.code) ?? [],
  }));

  const agendaByIndex = new Map<number, AgendaRow>();
  for (const row of agendaRows) {
    agendaByIndex.set(row.month_index, row);
  }
  const agenda: AgendaEntry[] = AGENDA_MONTHS.map((_, monthIndex) => {
    const row = agendaByIndex.get(monthIndex);
    return {
      monthIndex,
      datum: row?.datum ?? "",
      projecten: row?.projecten ?? "",
      opmerkingen: row?.opmerkingen ?? "",
    };
  });

  return { projects, agenda };
}
