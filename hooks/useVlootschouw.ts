"use client";

import { useCallback, useEffect, useState } from "react";
import type { UpsertPlanningInput } from "@/lib/vlootschouw/planning";
import type { VlootschouwOverzicht } from "@/lib/vlootschouw/types";
import {
  fetchVlootschouwOverzicht,
  updatePlanningCel,
} from "@/services/vlootschouw-client";

export function useVlootschouw() {
  const [overzicht, setOverzicht] = useState<VlootschouwOverzicht | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  const laad = useCallback(async () => {
    try {
      const data = await fetchVlootschouwOverzicht();
      setOverzicht(data);
      setLoadError("");
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Onbekende fout bij laden",
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchVlootschouwOverzicht();
        if (cancelled) return;
        setOverzicht(data);
        setLoadError("");
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Onbekende fout bij laden",
        );
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const wijzigPlanningCel = useCallback(
    async (input: UpsertPlanningInput) => {
      setSaveError("");
      try {
        await updatePlanningCel(input);
        await laad();
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "Opslaan mislukt",
        );
      }
    },
    [laad],
  );

  return {
    overzicht,
    hydrated,
    loadError,
    saveError,
    wijzigPlanningCel,
  };
}
