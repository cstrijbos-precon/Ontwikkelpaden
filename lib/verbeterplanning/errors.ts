export class ProjectCodeExistsError extends Error {
  constructor(code: string) {
    super(`Project met code "${code}" bestaat al`);
    this.name = "ProjectCodeExistsError";
  }
}

export class ProjectNotFoundError extends Error {
  constructor() {
    super("Project niet gevonden");
    this.name = "ProjectNotFoundError";
  }
}

export class MilestoneNotFoundError extends Error {
  constructor() {
    super("Milestone niet gevonden");
    this.name = "MilestoneNotFoundError";
  }
}

export class MilestoneLimitError extends Error {
  constructor() {
    super("Maximaal 10 milestones per project");
    this.name = "MilestoneLimitError";
  }
}

export class KpiNotFoundError extends Error {
  constructor() {
    super("KPI niet gevonden");
    this.name = "KpiNotFoundError";
  }
}

export class KpiLimitError extends Error {
  constructor() {
    super("Maximaal 4 KPI's per project");
    this.name = "KpiLimitError";
  }
}

export class UpdateNotFoundError extends Error {
  constructor() {
    super("Update niet gevonden");
    this.name = "UpdateNotFoundError";
  }
}

const NOT_FOUND_ERRORS = [
  ProjectNotFoundError,
  MilestoneNotFoundError,
  KpiNotFoundError,
  UpdateNotFoundError,
];

const CONFLICT_ERRORS = [
  ProjectCodeExistsError,
  MilestoneLimitError,
  KpiLimitError,
];

/** Vertaalt de verbeterplanning-domeinfouten naar de juiste HTTP-response; onbekende fouten worden generieke 500's. */
export function verbeterplanningErrorResponse(error: unknown): Response {
  if (NOT_FOUND_ERRORS.some((ErrorClass) => error instanceof ErrorClass)) {
    return Response.json({ error: (error as Error).message }, { status: 404 });
  }
  if (CONFLICT_ERRORS.some((ErrorClass) => error instanceof ErrorClass)) {
    return Response.json({ error: (error as Error).message }, { status: 409 });
  }
  if (process.env.NODE_ENV === "development") {
    console.error("verbeterplanning error:", error);
  }
  return Response.json({ error: "Interne fout" }, { status: 500 });
}
