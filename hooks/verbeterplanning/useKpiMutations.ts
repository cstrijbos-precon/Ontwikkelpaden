"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  findProjectAndKpi,
  updateKpi as updateKpiInBoard,
  updateProject,
} from "@/hooks/verbeterplanning/board-helpers";
import {
  KPI_QUARTERS,
  type KpiQuarterStatusOrEmpty,
  type KpiType,
  nextKpiStatus,
} from "@/lib/verbeterplanning/constants";
import type { VerbeterplanningBoard } from "@/lib/verbeterplanning/types";
import * as client from "@/services/verbeterplanning-client";

type SetBoard = React.Dispatch<
  React.SetStateAction<VerbeterplanningBoard | null>
>;

const NOTE_DEBOUNCE_MS = 1500;

export function useKpiMutations(
  board: VerbeterplanningBoard | null,
  setBoard: SetBoard,
) {
  const noteTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = noteTimers.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
    };
  }, []);

  const addKpi = useCallback(
    async (code: string, type: KpiType, description?: string) => {
      const created = await client.createKpi(code, type, description);
      setBoard((prev) =>
        prev
          ? updateProject(prev, code, (p) => ({
              ...p,
              kpis: [
                ...p.kpis,
                {
                  id: created.id,
                  type: created.type,
                  description: created.description,
                  quarters: new Array(KPI_QUARTERS.length)
                    .fill(null)
                    .map(() => ({
                      status: "" as KpiQuarterStatusOrEmpty,
                      note: "",
                    })),
                },
              ],
            }))
          : prev,
      );
    },
    [setBoard],
  );

  const editKpi = useCallback(
    async (
      code: string,
      id: string,
      patch: { type?: KpiType; description?: string },
    ) => {
      const updated = await client.updateKpi(id, patch);
      setBoard((prev) =>
        prev
          ? updateProject(prev, code, (p) =>
              updateKpiInBoard(p, id, (k) => ({
                ...k,
                type: updated.type,
                description: updated.description,
              })),
            )
          : prev,
      );
    },
    [setBoard],
  );

  const deleteKpi = useCallback(
    async (code: string, id: string) => {
      await client.deleteKpi(id);
      setBoard((prev) =>
        prev
          ? updateProject(prev, code, (p) => ({
              ...p,
              kpis: p.kpis.filter((k) => k.id !== id),
            }))
          : prev,
      );
    },
    [setBoard],
  );

  const cycleKpiStatus = useCallback(
    async (id: string, quarterIndex: number) => {
      if (!board) return;
      const found = findProjectAndKpi(board, id);
      if (!found) return;
      const previous = found.kpi.quarters[quarterIndex]?.status ?? "";
      const next = nextKpiStatus(previous);

      const applyStatus =
        (status: KpiQuarterStatusOrEmpty) =>
        (prev: VerbeterplanningBoard | null) =>
          prev
            ? updateProject(prev, found.project.code, (p) =>
                updateKpiInBoard(p, id, (k) => {
                  const quarters = [...k.quarters];
                  const cell = quarters[quarterIndex];
                  if (cell) quarters[quarterIndex] = { ...cell, status };
                  return { ...k, quarters };
                }),
              )
            : prev;

      setBoard(applyStatus(next));

      try {
        await client.setKpiStatus(id, quarterIndex, next);
      } catch (error) {
        setBoard(applyStatus(previous));
        throw error;
      }
    },
    [board, setBoard],
  );

  const updateKpiNote = useCallback(
    (id: string, quarterIndex: number, note: string) => {
      setBoard((prev) => {
        if (!prev) return prev;
        const found = findProjectAndKpi(prev, id);
        if (!found) return prev;
        return updateProject(prev, found.project.code, (p) =>
          updateKpiInBoard(p, id, (k) => {
            const quarters = [...k.quarters];
            const cell = quarters[quarterIndex];
            if (cell) quarters[quarterIndex] = { ...cell, note };
            return { ...k, quarters };
          }),
        );
      });

      const timerKey = `${id}-${quarterIndex}`;
      const existing = noteTimers.current.get(timerKey);
      if (existing) clearTimeout(existing);
      noteTimers.current.set(
        timerKey,
        setTimeout(() => {
          noteTimers.current.delete(timerKey);
          void client.setKpiNote(id, quarterIndex, note);
        }, NOTE_DEBOUNCE_MS),
      );
    },
    [setBoard],
  );

  const flushKpiNote = useCallback(
    (id: string, quarterIndex: number, note: string) => {
      const timerKey = `${id}-${quarterIndex}`;
      const existing = noteTimers.current.get(timerKey);
      if (existing) {
        clearTimeout(existing);
        noteTimers.current.delete(timerKey);
      }
      void client.setKpiNote(id, quarterIndex, note);
    },
    [],
  );

  return {
    addKpi,
    editKpi,
    deleteKpi,
    cycleKpiStatus,
    updateKpiNote,
    flushKpiNote,
  };
}
