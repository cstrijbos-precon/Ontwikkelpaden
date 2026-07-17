"use client";

import { useCallback, useEffect, useRef } from "react";
import type { VerbeterplanningBoard } from "@/lib/verbeterplanning/types";
import * as client from "@/services/verbeterplanning-client";

type SetBoard = React.Dispatch<
  React.SetStateAction<VerbeterplanningBoard | null>
>;
type AgendaField = "datum" | "projecten" | "opmerkingen";

const FIELD_DEBOUNCE_MS = 1500;

export function useAgendaMutations(setBoard: SetBoard) {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const current = timers.current;
    return () => {
      for (const timer of current.values()) clearTimeout(timer);
    };
  }, []);

  const send = useCallback(
    (monthIndex: number, field: AgendaField, value: string) => {
      const timerKey = `${monthIndex}-${field}`;
      const existing = timers.current.get(timerKey);
      if (existing) clearTimeout(existing);
      timers.current.set(
        timerKey,
        setTimeout(() => {
          timers.current.delete(timerKey);
          void client.setAgendaField(monthIndex, { [field]: value });
        }, FIELD_DEBOUNCE_MS),
      );
    },
    [],
  );

  const updateAgendaField = useCallback(
    (monthIndex: number, field: AgendaField, value: string) => {
      setBoard((prev) => {
        if (!prev) return prev;
        const agenda = prev.agenda.map((entry) =>
          entry.monthIndex === monthIndex
            ? { ...entry, [field]: value }
            : entry,
        );
        return { ...prev, agenda };
      });
      send(monthIndex, field, value);
    },
    [setBoard, send],
  );

  const flushAgendaField = useCallback(
    (monthIndex: number, field: AgendaField, value: string) => {
      const timerKey = `${monthIndex}-${field}`;
      const existing = timers.current.get(timerKey);
      if (existing) {
        clearTimeout(existing);
        timers.current.delete(timerKey);
      }
      void client.setAgendaField(monthIndex, { [field]: value });
    },
    [],
  );

  return { updateAgendaField, flushAgendaField };
}
