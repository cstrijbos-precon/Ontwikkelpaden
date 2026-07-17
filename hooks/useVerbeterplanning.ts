"use client";

import { useCallback, useEffect, useState } from "react";
import { useAgendaMutations } from "@/hooks/verbeterplanning/useAgendaMutations";
import { useKpiMutations } from "@/hooks/verbeterplanning/useKpiMutations";
import { useMilestoneMutations } from "@/hooks/verbeterplanning/useMilestoneMutations";
import { useProjectMutations } from "@/hooks/verbeterplanning/useProjectMutations";
import { useUpdateMutations } from "@/hooks/verbeterplanning/useUpdateMutations";
import type { VerbeterplanningBoard } from "@/lib/verbeterplanning/types";
import { fetchBoard } from "@/services/verbeterplanning-client";

export function useVerbeterplanning() {
  const [board, setBoard] = useState<VerbeterplanningBoard | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchBoard();
        if (cancelled) return;
        setBoard(data);
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

  const refresh = useCallback(async () => {
    try {
      const data = await fetchBoard();
      setBoard(data);
      setLoadError("");
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Onbekende fout bij verversen",
      );
    }
  }, []);

  const projectMutations = useProjectMutations(board, setBoard);
  const milestoneMutations = useMilestoneMutations(board, setBoard);
  const kpiMutations = useKpiMutations(board, setBoard);
  const updateMutations = useUpdateMutations(board, setBoard);
  const agendaMutations = useAgendaMutations(setBoard);

  return {
    board,
    hydrated,
    loadError,
    refresh,
    ...projectMutations,
    ...milestoneMutations,
    ...kpiMutations,
    ...updateMutations,
    ...agendaMutations,
  };
}

/** Alleen de mutatiefuncties (geen data/state) — doorgegeven aan diep geneste organisms. */
export type VerbeterplanningActions = Omit<
  ReturnType<typeof useVerbeterplanning>,
  "board" | "hydrated" | "loadError" | "refresh"
>;
