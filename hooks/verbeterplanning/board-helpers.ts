import type {
  Kpi,
  Milestone,
  Project,
  VerbeterplanningBoard,
} from "@/lib/verbeterplanning/types";

/** Immutabele helpers om één project/milestone/KPI binnen het board te vervangen. Geen hooks — puur data. */

export function updateProject(
  board: VerbeterplanningBoard,
  code: string,
  updater: (project: Project) => Project,
): VerbeterplanningBoard {
  return {
    ...board,
    projects: board.projects.map((project) =>
      project.code === code ? updater(project) : project,
    ),
  };
}

export function updateMilestone(
  project: Project,
  milestoneId: string,
  updater: (milestone: Milestone) => Milestone,
): Project {
  return {
    ...project,
    milestones: project.milestones.map((milestone) =>
      milestone.id === milestoneId ? updater(milestone) : milestone,
    ),
  };
}

export function updateKpi(
  project: Project,
  kpiId: string,
  updater: (kpi: Kpi) => Kpi,
): Project {
  return {
    ...project,
    kpis: project.kpis.map((kpi) => (kpi.id === kpiId ? updater(kpi) : kpi)),
  };
}

export function findProjectAndMilestone(
  board: VerbeterplanningBoard,
  milestoneId: string,
): { project: Project; milestone: Milestone } | null {
  for (const project of board.projects) {
    const milestone = project.milestones.find((m) => m.id === milestoneId);
    if (milestone) return { project, milestone };
  }
  return null;
}

export function findProjectAndKpi(
  board: VerbeterplanningBoard,
  kpiId: string,
): { project: Project; kpi: Kpi } | null {
  for (const project of board.projects) {
    const kpi = project.kpis.find((k) => k.id === kpiId);
    if (kpi) return { project, kpi };
  }
  return null;
}

export function findProjectByUpdateId(
  board: VerbeterplanningBoard,
  updateId: string,
): Project | null {
  return (
    board.projects.find((project) =>
      project.updates.some((u) => u.id === updateId),
    ) ?? null
  );
}
