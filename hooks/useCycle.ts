import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import { setStoredGesprekId } from "@/lib/gesprekken-session";
import { mergeWithInitialState } from "@/lib/initial-state";
import { saveGesprek, startNewCycle } from "@/services/gesprekken-client";
import type { GesprekStatus } from "@/types/gesprekken";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface UseCycleParams {
  gesprekId: string | null;
  state: OntwikkelpadenState;
  setState: Dispatch<SetStateAction<OntwikkelpadenState>>;
  setGesprekId: (id: string) => void;
  setStatus: (status: GesprekStatus) => void;
  setPreviousGesprekId: (id: string | null) => void;
  setMedewerkerEmail: (email: string | null) => void;
  setHuidig: (index: number) => void;
  setSaveStatus: (message: string) => void;
}

/** Digitaal akkoord (afronden) en het starten van de volgende jaarcyclus. */
export function useCycle({
  gesprekId,
  state,
  setState,
  setGesprekId,
  setStatus,
  setPreviousGesprekId,
  setMedewerkerEmail,
  setHuidig,
  setSaveStatus,
}: UseCycleParams) {
  const handleAfronden = useCallback(async () => {
    if (!gesprekId) return;
    setSaveStatus("Opslaan...");
    try {
      await saveGesprek(gesprekId, state, "completed");
      setStatus("completed");
      setSaveStatus("✓ Gesprek afgerond");
    } catch {
      setSaveStatus("⚠ Afronden mislukt");
    } finally {
      setTimeout(() => setSaveStatus(""), 3000);
    }
  }, [gesprekId, state, setStatus, setSaveStatus]);

  const handleStartNewCycle = useCallback(async () => {
    if (!gesprekId) return;
    setSaveStatus("Nieuwe cyclus starten...");
    try {
      const nieuw = await startNewCycle(gesprekId);
      setStoredGesprekId(nieuw.id);
      setGesprekId(nieuw.id);
      setState(mergeWithInitialState(nieuw.state));
      setStatus(nieuw.status);
      setPreviousGesprekId(nieuw.previousGesprekId ?? null);
      setMedewerkerEmail(nieuw.medewerkerEmail ?? null);
      setHuidig(0);
      setSaveStatus("✓ Nieuwe cyclus gestart");
    } catch {
      setSaveStatus("⚠ Starten mislukt");
    } finally {
      setTimeout(() => setSaveStatus(""), 3000);
    }
  }, [
    gesprekId,
    setGesprekId,
    setState,
    setStatus,
    setPreviousGesprekId,
    setMedewerkerEmail,
    setHuidig,
    setSaveStatus,
  ]);

  return { handleAfronden, handleStartNewCycle };
}
