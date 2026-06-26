import type { Gesprek, GesprekListItem } from "@/types/gesprekken";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Verzoek mislukt");
  }
  return data as T;
}

export async function fetchGesprekkenList(): Promise<GesprekListItem[]> {
  const res = await fetch("/api/gesprekken");
  const data = await parseJson<{ items: GesprekListItem[] }>(res);
  return data.items;
}

export async function fetchGesprek(id: string): Promise<Gesprek> {
  const res = await fetch(`/api/gesprekken/${id}`);
  return parseJson<Gesprek>(res);
}

export async function createGesprek(
  state?: OntwikkelpadenState,
): Promise<Gesprek> {
  const res = await fetch("/api/gesprekken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state ? { state } : {}),
  });
  return parseJson<Gesprek>(res);
}

export async function saveGesprek(
  id: string,
  state: OntwikkelpadenState,
): Promise<Gesprek> {
  const res = await fetch(`/api/gesprekken/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
  return parseJson<Gesprek>(res);
}
