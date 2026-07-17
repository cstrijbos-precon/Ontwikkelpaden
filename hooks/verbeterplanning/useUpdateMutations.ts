"use client";

import { useCallback } from "react";
import {
  findProjectByUpdateId,
  updateProject,
} from "@/hooks/verbeterplanning/board-helpers";
import type { VerbeterplanningBoard } from "@/lib/verbeterplanning/types";
import * as client from "@/services/verbeterplanning-client";

type SetBoard = React.Dispatch<
  React.SetStateAction<VerbeterplanningBoard | null>
>;

export function useUpdateMutations(
  board: VerbeterplanningBoard | null,
  setBoard: SetBoard,
) {
  const addUpdate = useCallback(
    async (code: string, text: string) => {
      const created = await client.createUpdate(code, text);
      setBoard((prev) =>
        prev
          ? updateProject(prev, code, (p) => ({
              ...p,
              updates: [created, ...p.updates],
            }))
          : prev,
      );
    },
    [setBoard],
  );

  const editUpdate = useCallback(
    async (id: string, text: string) => {
      if (!board) return;
      const project = findProjectByUpdateId(board, id);
      if (!project) return;
      const updated = await client.editUpdate(id, text);
      setBoard((prev) =>
        prev
          ? updateProject(prev, project.code, (p) => ({
              ...p,
              updates: p.updates.map((u) => (u.id === id ? updated : u)),
            }))
          : prev,
      );
    },
    [board, setBoard],
  );

  const deleteUpdate = useCallback(
    async (id: string) => {
      if (!board) return;
      const project = findProjectByUpdateId(board, id);
      if (!project) return;
      await client.deleteUpdate(id);
      setBoard((prev) =>
        prev
          ? updateProject(prev, project.code, (p) => ({
              ...p,
              updates: p.updates.filter((u) => u.id !== id),
            }))
          : prev,
      );
    },
    [board, setBoard],
  );

  return { addUpdate, editUpdate, deleteUpdate };
}
