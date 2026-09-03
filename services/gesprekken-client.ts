import type {
  BekendeMedewerker,
  BeoordelaarRol,
  DashboardOverzicht,
  Gesprek,
  GesprekListItem,
  GesprekStatus,
} from "@/types/gesprekken";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

export interface ImportGesprekDocxResult {
  state: Partial<OntwikkelpadenState>;
  warnings: string[];
}

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

export interface CreateGesprekOptions {
  medewerkerEmail?: string;
  status?: GesprekStatus;
}

export async function createGesprek(
  state?: OntwikkelpadenState,
  options?: CreateGesprekOptions,
): Promise<Gesprek> {
  const res = await fetch("/api/gesprekken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(state ? { state } : {}),
      ...(options?.medewerkerEmail
        ? { medewerkerEmail: options.medewerkerEmail }
        : {}),
      ...(options?.status ? { status: options.status } : {}),
    }),
  });
  return parseJson<Gesprek>(res);
}

export async function saveGesprek(
  id: string,
  state: OntwikkelpadenState,
  status?: GesprekStatus,
  medewerkerEmail?: string | null,
): Promise<Gesprek> {
  const res = await fetch(`/api/gesprekken/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      state,
      ...(status ? { status } : {}),
      ...(medewerkerEmail !== undefined ? { medewerkerEmail } : {}),
    }),
  });
  return parseJson<Gesprek>(res);
}

export async function fetchKnownUserEmails(): Promise<string[]> {
  const res = await fetch("/api/users");
  const data = await parseJson<{ emails: string[] }>(res);
  return data.emails;
}

export async function importGesprekDocx(
  file: File,
): Promise<ImportGesprekDocxResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/gesprekken/import-docx", {
    method: "POST",
    body: formData,
  });
  return parseJson<ImportGesprekDocxResult>(res);
}

export async function startNewCycle(id: string): Promise<Gesprek> {
  const res = await fetch(`/api/gesprekken/${id}/next-cycle`, {
    method: "POST",
  });
  return parseJson<Gesprek>(res);
}

export async function fetchDashboard(): Promise<DashboardOverzicht> {
  const res = await fetch("/api/dashboard");
  return parseJson<DashboardOverzicht>(res);
}

export async function fetchBekendeMedewerkers(): Promise<BekendeMedewerker[]> {
  const res = await fetch("/api/medewerkers");
  const data = await parseJson<{ medewerkers: BekendeMedewerker[] }>(res);
  return data.medewerkers;
}

export async function koppelBeoordelaar(
  medewerkerEmail: string,
  rol: BeoordelaarRol,
): Promise<Gesprek> {
  const res = await fetch("/api/medewerkers/koppel-beoordelaar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ medewerkerEmail, rol }),
  });
  return parseJson<Gesprek>(res);
}

export async function respondBeoordelaarKoppeling(
  gesprekId: string,
  rol: BeoordelaarRol,
  actie: "goedkeuren" | "afwijzen",
): Promise<Gesprek> {
  const res = await fetch(`/api/gesprekken/${gesprekId}/beoordelaar-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rol, actie }),
  });
  return parseJson<Gesprek>(res);
}

/** Antwoord op de vraag "mag deze persoon al je verslagen inzien?" */
export async function respondHoofdbeoordelaarKoppeling(
  actie: "goedkeuren" | "afwijzen",
): Promise<void> {
  const res = await fetch("/api/hoofdbeoordelaar-koppeling", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actie }),
  });
  await parseJson<{ ok: true }>(res);
}
