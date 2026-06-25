"use client";

import { useCallback, useEffect, useState } from "react";
import { exportWord } from "@/lib/export-word";
import {
  createInitialState,
  loadStateFromStorage,
  saveStateToStorage,
} from "@/lib/initial-state";
import type { CompId, OntwikkelpadenState, PadId } from "@/types/ontwikkelpaden";

export function useOntwikkelpaden() {
  const [huidig, setHuidig] = useState(0);
  const [state, setState] = useState<OntwikkelpadenState>(createInitialState);
  const [saveStatus, setSaveStatus] = useState("");
  const [openComps, setOpenComps] = useState<Set<string>>(new Set());
  const [openSterren, setOpenSterren] = useState<Set<string>>(new Set());
  const [openPopPads, setOpenPopPads] = useState<Set<string>>(new Set());
  const [openToolboxes, setOpenToolboxes] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadStateFromStorage());
    setHydrated(true);
  }, []);

  const save = useCallback((nextState: OntwikkelpadenState) => {
    saveStateToStorage(nextState);
    const time = new Date().toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setSaveStatus(`✓ Opgeslagen om ${time}`);
    setTimeout(() => setSaveStatus(""), 3000);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(() => save(state), 30000);
    return () => clearInterval(interval);
  }, [hydrated, state, save]);

  const updateField = useCallback(
    <K extends keyof OntwikkelpadenState>(key: K, value: OntwikkelpadenState[K]) => {
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
      scores: { ...prev.scores, [compId]: n },
    }));
  }, []);

  const setVorigJaar = useCallback((padId: PadId, n: number) => {
    setState((prev) => ({
      ...prev,
      vorigJaar: { ...prev.vorigJaar, [padId]: n },
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
      save(state);
      setHuidig(index);
      window.scrollTo(0, 0);
    },
    [state, save],
  );

  const volgende = useCallback(() => naarScherm(Math.min(huidig + 1, 8)), [huidig, naarScherm]);
  const terug = useCallback(() => naarScherm(Math.max(huidig - 1, 0)), [huidig, naarScherm]);

  const handleSave = useCallback(() => save(state), [state, save]);

  const handleExport = useCallback(() => {
    save(state);
    exportWord(state);
  }, [state, save]);

  return {
    huidig,
    state,
    saveStatus,
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
