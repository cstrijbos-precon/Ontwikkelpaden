import {
  getStoredGesprekId,
  setStoredGesprekId,
} from "@/lib/gesprekken-session";
import { mergeWithInitialState } from "@/lib/initial-state";
import {
  createGesprek,
  fetchGesprek,
  fetchGesprekkenList,
} from "@/services/gesprekken-client";
import type { GesprekStatus } from "@/types/gesprekken";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

export interface ActiveGesprek {
  id: string;
  state: OntwikkelpadenState;
  status: GesprekStatus;
  previousGesprekId: string | null;
  medewerkerEmail: string | null;
}

export async function loadActiveGesprek(): Promise<ActiveGesprek> {
  const storedId = getStoredGesprekId();
  if (storedId) {
    try {
      const gesprek = await fetchGesprek(storedId);
      setStoredGesprekId(gesprek.id);
      return {
        id: gesprek.id,
        state: mergeWithInitialState(gesprek.state),
        status: gesprek.status ?? "draft",
        previousGesprekId: gesprek.previousGesprekId ?? null,
        medewerkerEmail: gesprek.medewerkerEmail ?? null,
      };
    } catch {
      // Stored id invalid — fall through to list/create.
    }
  }

  const items = await fetchGesprekkenList();
  const preferred = items.find((item) => item.status === "draft") ?? items[0];
  if (preferred) {
    const gesprek = await fetchGesprek(preferred.id);
    setStoredGesprekId(gesprek.id);
    return {
      id: gesprek.id,
      state: mergeWithInitialState(gesprek.state),
      status: gesprek.status ?? "draft",
      previousGesprekId: gesprek.previousGesprekId ?? null,
      medewerkerEmail: gesprek.medewerkerEmail ?? null,
    };
  }

  const created = await createGesprek();
  setStoredGesprekId(created.id);
  return {
    id: created.id,
    state: mergeWithInitialState(created.state),
    status: created.status ?? "draft",
    previousGesprekId: created.previousGesprekId ?? null,
    medewerkerEmail: created.medewerkerEmail ?? null,
  };
}
