"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCycle } from "@/hooks/useCycle";
import { useReflecties } from "@/hooks/useReflecties";
import { exportWord } from "@/lib/export-word";
import { clampPadNiveau, clampScore } from "@/lib/field-format";
import { wachtendeKoppelingen } from "@/lib/gesprekken-access";
import { createInitialState, mergeWithInitialState } from "@/lib/initial-state";
import { loadActiveGesprek } from "@/lib/load-active-gesprek";
import {
  fetchGesprek,
  fetchKnownUserEmails,
  importGesprekDocx,
  saveGesprek,
} from "@/services/gesprekken-client";
import type { GesprekStatus } from "@/types/gesprekken";
import type {
  CompId,
  OntwikkelpadenState,
  PadId,
} from "@/types/ontwikkelpaden";

export function useOntwikkelpaden(gesprekIdParam?: string) {
  const schermParam = useSearchParams().get("scherm");
  const [huidig, setHuidig] = useState(0);
  const [gesprekId, setGesprekId] = useState<string | null>(null);
  const [state, setState] = useState<OntwikkelpadenState>(createInitialState);
  const [status, setStatus] = useState<GesprekStatus>("draft");
  const [previousGesprekId, setPreviousGesprekId] = useState<string | null>(
    null,
  );
  const [medewerkerEmail, setMedewerkerEmailState] = useState<string | null>(
    null,
  );
  // Welke koppelingen nog op akkoord van de medewerker wachten.
  const [wachtendeRollen, setWachtendeRollen] = useState<string[]>([]);
  const [knownEmails, setKnownEmails] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [loadError, setLoadError] = useState("");
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
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
        if (gesprekIdParam) {
          const gesprek = await fetchGesprek(gesprekIdParam);
          if (cancelled) return;
          setGesprekId(gesprek.id);
          setState(mergeWithInitialState(gesprek.state));
          setStatus(gesprek.status ?? "draft");
          setPreviousGesprekId(gesprek.previousGesprekId ?? null);
          setMedewerkerEmailState(gesprek.medewerkerEmail ?? null);
          setWachtendeRollen(wachtendeKoppelingen(gesprek));
          const schermIndex = schermParam ? Number(schermParam) : null;
          if (schermIndex !== null && !Number.isNaN(schermIndex)) {
            setHuidig(schermIndex);
          }
        } else {
          const active = await loadActiveGesprek();
          if (cancelled) return;
          setGesprekId(active.id);
          setState(active.state);
          setStatus(active.status ?? "draft");
          setPreviousGesprekId(active.previousGesprekId ?? null);
          setMedewerkerEmailState(active.medewerkerEmail ?? null);
          setWachtendeRollen(wachtendeKoppelingen(active));
        }
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
  }, [gesprekIdParam, schermParam]);

  useEffect(() => {
    let cancelled = false;
    fetchKnownUserEmails()
      .then((emails) => {
        if (!cancelled) setKnownEmails(emails);
      })
      .catch(() => {
        // Autocomplete is best-effort; geen bekende adressen is geen blokkade.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { addReflectie, updateReflectie, removeReflectie } =
    useReflecties(setState);
  const { handleAfronden, handleStartNewCycle } = useCycle({
    gesprekId,
    state,
    setState,
    setGesprekId,
    setStatus,
    setPreviousGesprekId,
    setMedewerkerEmail: setMedewerkerEmailState,
    setHuidig,
    setSaveStatus,
  });

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

  const setMedewerkerEmail = useCallback(
    async (email: string | null) => {
      if (!gesprekId) return;
      const previous = medewerkerEmail;
      setMedewerkerEmailState(email);
      try {
        await saveGesprek(gesprekId, state, undefined, email);
      } catch {
        setMedewerkerEmailState(previous);
        setSaveStatus("⚠ Koppelen mislukt");
        setTimeout(() => setSaveStatus(""), 3000);
      }
    },
    [gesprekId, state, medewerkerEmail],
  );

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

  const setNiveauCorrectie = useCallback(
    (padId: PadId, niveau: number | null) => {
      setState((prev) => {
        const niveauCorrectie = {
          ...prev.niveauCorrectie,
          [padId]: niveau === null ? null : clampPadNiveau(niveau),
        };
        const nogCorrecties = Object.values(niveauCorrectie).some(
          (n) => n !== null,
        );
        return {
          ...prev,
          niveauCorrectie,
          // Zonder aanpassingen hoort er ook geen toelichting te blijven staan.
          niveauCorrectieToelichting: nogCorrecties
            ? prev.niveauCorrectieToelichting
            : "",
        };
      });
    },
    [],
  );

  const toggleAmbitie = useCallback((padId: PadId) => {
    // De trainingsgroep staat los van de ambitie en blijft dus staan.
    setState((prev) => ({
      ...prev,
      ambities: { ...prev.ambities, [padId]: !prev.ambities[padId] },
    }));
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

  /**
   * Een import wordt meteen bewaard. Zonder die opslag bestond het resultaat
   * alleen in de browser: de velden stonden wel op het scherm, maar wie ze
   * bekeek en het tabblad sloot was alles kwijt — zonder melding. Opslaan
   * gebeurde pas bij een schermwissel, de knop Opslaan, of de autosave na vijf
   * minuten.
   */
  const handleImportDocx = useCallback(
    async (file: File) => {
      try {
        const result = await importGesprekDocx(file);
        const samengevoegd = { ...state, ...result.state };
        setState(samengevoegd);
        setImportWarnings(result.warnings);
        await save(samengevoegd);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Import mislukt";
        setImportWarnings([message]);
      }
    },
    [state, save],
  );

  const dismissImportWarnings = useCallback(() => {
    setImportWarnings([]);
  }, []);

  return {
    huidig,
    state,
    status,
    previousGesprekId,
    medewerkerEmail,
    wachtendeRollen,
    knownEmails,
    setMedewerkerEmail,
    saveStatus,
    loadError,
    importWarnings,
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
    setNiveauCorrectie,
    toggleAmbitie,
    setTrainingsgroep,
    toggleTCell,
    toggleComp,
    toggleSter,
    togglePopPad,
    toggleToolbox,
    addReflectie,
    updateReflectie,
    removeReflectie,
    handleAfronden,
    handleStartNewCycle,
    naarScherm,
    volgende,
    terug,
    handleSave,
    handleExport,
    handleImportDocx,
    dismissImportWarnings,
  };
}
