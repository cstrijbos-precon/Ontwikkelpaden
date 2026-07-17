import type {
  KpiQuarterStatusOrEmpty,
  KpiType,
  ProjectMonthStatusOrEmpty,
  Resultaatgebied,
} from "@/lib/verbeterplanning/constants";

export interface Update {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
}

export interface KpiQuarter {
  status: KpiQuarterStatusOrEmpty;
  note: string;
}

export interface Kpi {
  id: string;
  type: KpiType;
  description: string;
  quarters: KpiQuarter[]; // length KPI_QUARTERS.length, index-aligned
}

export interface Milestone {
  id: string;
  name: string;
  statuses: ProjectMonthStatusOrEmpty[]; // length MONTHS.length, index-aligned
}

export interface Project {
  code: string;
  title: string;
  mtlid: string;
  trekker: string;
  team: string;
  rg: string;
  kpi: string;
  group: Resultaatgebied;
  statuses: ProjectMonthStatusOrEmpty[]; // length MONTHS.length, index-aligned
  milestones: Milestone[];
  kpis: Kpi[];
  updates: Update[]; // newest first
}

export interface AgendaEntry {
  monthIndex: number;
  datum: string;
  projecten: string;
  opmerkingen: string;
}

export interface VerbeterplanningBoard {
  projects: Project[];
  agenda: AgendaEntry[]; // length AGENDA_MONTHS.length, index-aligned
}
