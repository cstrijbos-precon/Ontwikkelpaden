import type {
  KpiQuarterStatusOrEmpty,
  KpiType,
  ProjectMonthStatusOrEmpty,
  Resultaatgebied,
} from "@/lib/verbeterplanning/constants";
import type { KpiMeta } from "@/lib/verbeterplanning/kpis";
import type { MilestoneMeta } from "@/lib/verbeterplanning/milestones";
import type {
  CreateProjectInput,
  ProjectMeta,
  UpdateProjectMetaInput,
} from "@/lib/verbeterplanning/projects";
import type {
  AgendaEntry,
  Update,
  VerbeterplanningBoard,
} from "@/lib/verbeterplanning/types";

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Verzoek mislukt");
  }
  return data as T;
}

async function patchJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson<T>(res);
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson<T>(res);
}

async function deleteRequest(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Verzoek mislukt");
  }
}

export async function fetchBoard(): Promise<VerbeterplanningBoard> {
  const res = await fetch("/api/verbeterplanning");
  return parseJson<VerbeterplanningBoard>(res);
}

export async function createProject(
  input: CreateProjectInput,
): Promise<ProjectMeta> {
  return postJson<ProjectMeta>("/api/verbeterplanning/projects", input);
}

export async function updateProjectMeta(
  code: string,
  patch: UpdateProjectMetaInput,
): Promise<ProjectMeta> {
  return patchJson<ProjectMeta>(
    `/api/verbeterplanning/projects/${code}`,
    patch,
  );
}

export async function setProjectStatus(
  code: string,
  monthIndex: number,
  status: ProjectMonthStatusOrEmpty,
): Promise<void> {
  await patchJson(`/api/verbeterplanning/projects/${code}/status`, {
    monthIndex,
    status,
  });
}

export async function createMilestone(
  code: string,
  name: string,
): Promise<MilestoneMeta> {
  return postJson<MilestoneMeta>(
    `/api/verbeterplanning/projects/${code}/milestones`,
    { name },
  );
}

export async function renameMilestone(
  id: string,
  name: string,
): Promise<MilestoneMeta> {
  return patchJson<MilestoneMeta>(`/api/verbeterplanning/milestones/${id}`, {
    name,
  });
}

export async function deleteMilestone(id: string): Promise<void> {
  await deleteRequest(`/api/verbeterplanning/milestones/${id}`);
}

export async function setMilestoneStatus(
  id: string,
  monthIndex: number,
  status: ProjectMonthStatusOrEmpty,
): Promise<void> {
  await patchJson(`/api/verbeterplanning/milestones/${id}/status`, {
    monthIndex,
    status,
  });
}

export async function createKpi(
  code: string,
  type: KpiType,
  description?: string,
): Promise<KpiMeta> {
  return postJson<KpiMeta>(`/api/verbeterplanning/projects/${code}/kpis`, {
    type,
    description,
  });
}

export async function updateKpi(
  id: string,
  patch: { type?: KpiType; description?: string },
): Promise<KpiMeta> {
  return patchJson<KpiMeta>(`/api/verbeterplanning/kpis/${id}`, patch);
}

export async function deleteKpi(id: string): Promise<void> {
  await deleteRequest(`/api/verbeterplanning/kpis/${id}`);
}

export async function setKpiStatus(
  id: string,
  quarterIndex: number,
  status: KpiQuarterStatusOrEmpty,
): Promise<void> {
  await patchJson(`/api/verbeterplanning/kpis/${id}/status`, {
    quarterIndex,
    status,
  });
}

export async function setKpiNote(
  id: string,
  quarterIndex: number,
  note: string,
): Promise<void> {
  await patchJson(`/api/verbeterplanning/kpis/${id}/note`, {
    quarterIndex,
    note,
  });
}

export async function createUpdate(
  code: string,
  text: string,
): Promise<Update> {
  return postJson<Update>(`/api/verbeterplanning/projects/${code}/updates`, {
    text,
  });
}

export async function editUpdate(id: string, text: string): Promise<Update> {
  return patchJson<Update>(`/api/verbeterplanning/updates/${id}`, { text });
}

export async function deleteUpdate(id: string): Promise<void> {
  await deleteRequest(`/api/verbeterplanning/updates/${id}`);
}

export async function setAgendaField(
  monthIndex: number,
  patch: { datum?: string; projecten?: string; opmerkingen?: string },
): Promise<AgendaEntry> {
  return patchJson<AgendaEntry>(
    `/api/verbeterplanning/agenda/${monthIndex}`,
    patch,
  );
}

export type { Resultaatgebied };
