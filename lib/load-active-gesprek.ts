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
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

export interface ActiveGesprek {
  id: string;
  state: OntwikkelpadenState;
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
    };
  }

  const created = await createGesprek();
  setStoredGesprekId(created.id);
  return {
    id: created.id,
    state: mergeWithInitialState(created.state),
  };
}
