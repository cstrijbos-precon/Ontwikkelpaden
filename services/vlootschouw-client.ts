import type { UpsertPlanningInput } from "@/lib/vlootschouw/planning";
import type { VlootschouwOverzicht } from "@/lib/vlootschouw/types";

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Verzoek mislukt");
  }
  return data as T;
}

export async function fetchVlootschouwOverzicht(): Promise<VlootschouwOverzicht> {
  const res = await fetch("/api/vlootschouw");
  return parseJson<VlootschouwOverzicht>(res);
}

export async function updatePlanningCel(
  input: UpsertPlanningInput,
): Promise<void> {
  const res = await fetch("/api/vlootschouw/planning", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  await parseJson<{ ok: boolean }>(res);
}
