"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { exportWord } from "@/lib/export-word";
import { clampPadNiveau, clampScore } from "@/lib/field-format";
import { createInitialState } from "@/lib/initial-state";
import { loadActiveGesprek } from "@/lib/load-active-gesprek";
import { saveGesprek } from "@/services/gesprekken-client";
import type {
  CompId,
  OntwikkelpadenState,
  PadId,
} from "@/types/ontwikkelpaden";

export function useOntwikkelpaden() {
  const [huidig, setHuidig] = useState(0);
  const [gesprekId, setGesprekId] = useState<string | null>(null);
  const [state, setState] = useState<OntwikkelpadenState>(createInitialState);
  const [saveStatus, setSaveStatus] = useState("");
  const [loadError, setLoadError] = useState("");
  const [openComps, setOpenComps] = useState<Set<string>>(new Set());
  const [openSterren, setOpenSterren] = useState<Set<string>>(new Set());
  const [openPopPads, setOpenPopPads] = useState<Set<string>>(new Set());
  const [openToolboxes, setOpenToolboxes] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const savingRef = useRef(false);
  const pendingStateRef = useRef<OntwikkelpadenState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const active = await loadActiveGesprek();
        if (cancelled) return;
        setGesprekId(active.id);
        setState(active.state);
        setLoadError("");
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Onbekende fout bij laden";
        setLoadError(message);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(
    async (nextState: OntwikkelpadenState) => {
      if (!gesprekId) return;

      pendingStateRef.current = nextState;
      if (savingRef.current) return;

      savingRef.current = true;
      setSaveStatus("Opslaan...");

      try {
        while (pendingStateRef.current) {
          const toSave = pendingStateRef.current;
          pendingStateRef.current = null;
          await saveGesprek(gesprekId, toSave);
        }
        const time = new Date().toLocaleTimeString("nl-NL", {
          hour: "2-digit",
          minute: "2-digit",
        });
        setSaveStatus(`✓ Opgeslagen om ${time}`);
      } catch {
        setSaveStatus("⚠ Opslaan mislukt");
      } finally {
        savingRef.current = false;
        setTimeout(() => setSaveStatus(""), 3000);
      }
    },
    [gesprekId],
  );

  useEffect(() => {
    if (!hydrated || !gesprekId || loadError) return;
    const interval = setInterval(() => {
      void save(state);
    }, 300_000);
    return () => clearInterval(interval);
  }, [hydrated, gesprekId, loadError, state, save]);

  const updateField = useCallback(
    <K extends keyof OntwikkelpadenState>(
      key: K,
      value: OntwikkelpadenState[K],
    ) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateSituatie = useCallback((index: number, value: string) => {
    setState((prev) => {
      const situaties = [...prev.situaties];
      situaties[index] = value;
      return { ...prev, situaties };
    });
  }, []);

  const updateOpmerking = useCallback((compId: CompId, value: string) => {
    setState((prev) => ({
      ...prev,
      opmerkingen: { ...prev.opmerkingen, [compId]: value },
    }));
  }, []);

  const setSter = useCallback((compId: CompId, n: number) => {
    setState((prev) => ({
      ...prev,
      scores: { ...prev.scores, [compId]: clampScore(n) },
    }));
  }, []);

  const setVorigJaar = useCallback((padId: PadId, n: number) => {
    setState((prev) => ({
      ...prev,
      vorigJaar: { ...prev.vorigJaar, [padId]: clampPadNiveau(n) },
    }));
  }, []);

  const toggleAmbitie = useCallback((padId: PadId) => {
    setState((prev) => {
      const next = !prev.ambities[padId];
      return {
        ...prev,
        ambities: { ...prev.ambities, [padId]: next },
        trainingsgroepen: next
          ? prev.trainingsgroepen
          : { ...prev.trainingsgroepen, [padId]: "" },
      };
    });
  }, []);

  const setTrainingsgroep = useCallback((padId: PadId, value: string) => {
    setState((prev) => ({
      ...prev,
      trainingsgroepen: { ...prev.trainingsgroepen, [padId]: value },
    }));
  }, []);

  const toggleTCell = useCallback((r: number, k: number) => {
    const key = `${r}-${k}`;
    setState((prev) => {
      const idx = prev.tCellen.indexOf(key);
      const tCellen =
        idx > -1
          ? prev.tCellen.filter((c) => c !== key)
          : [...prev.tCellen, key];
      return { ...prev, tCellen };
    });
  }, []);

  const toggleComp = useCallback((id: string) => {
    setOpenComps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSter = useCallback((id: string) => {
    setOpenSterren((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const togglePopPad = useCallback((id: string) => {
    setOpenPopPads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleToolbox = useCallback((id: string) => {
    setOpenToolboxes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const naarScherm = useCallback(
    (index: number) => {
      void save(state);
      setHuidig(index);
      window.scrollTo(0, 0);
    },
    [state, save],
  );

  const volgende = useCallback(
    () => naarScherm(Math.min(huidig + 1, 8)),
    [huidig, naarScherm],
  );
  const terug = useCallback(
    () => naarScherm(Math.max(huidig - 1, 0)),
    [huidig, naarScherm],
  );

  const handleSave = useCallback(() => {
    void save(state);
  }, [state, save]);

  const handleExport = useCallback(() => {
    void save(state);
    exportWord(state);
  }, [state, save]);

  return {
    huidig,
    state,
    saveStatus,
    loadError,
    hydrated,
    openComps,
    openSterren,
    openPopPads,
    openToolboxes,
    updateField,
    updateSituatie,
    updateOpmerking,
    setSter,
    setVorigJaar,
    toggleAmbitie,
    setTrainingsgroep,
    toggleTCell,
    toggleComp,
    toggleSter,
    togglePopPad,
    toggleToolbox,
    naarScherm,
    volgende,
    terug,
    handleSave,
    handleExport,
  };
}
