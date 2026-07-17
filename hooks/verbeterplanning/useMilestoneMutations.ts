"use client";

import { useCallback } from "react";
import {
  findProjectAndMilestone,
  updateMilestone,
  updateProject,
} from "@/hooks/verbeterplanning/board-helpers";
import {
  MONTHS,
  nextProjectStatus,
  type ProjectMonthStatusOrEmpty,
} from "@/lib/verbeterplanning/constants";
import type { VerbeterplanningBoard } from "@/lib/verbeterplanning/types";
import * as client from "@/services/verbeterplanning-client";

type SetBoard = React.Dispatch<
  React.SetStateAction<VerbeterplanningBoard | null>
>;

export function useMilestoneMutations(
  board: VerbeterplanningBoard | null,
  setBoard: SetBoard,
) {
  const addMilestone = useCallback(
    async (code: string, name: string) => {
      const created = await client.createMilestone(code, name);
      setBoard((prev) =>
        prev
          ? updateProject(prev, code, (p) => ({
              ...p,
              milestones: [
                ...p.milestones,
                {
                  id: created.id,
                  name: created.name,
                  statuses: new Array<ProjectMonthStatusOrEmpty>(
                    MONTHS.length,
                  ).fill(""),
                },
              ],
            }))
          : prev,
      );
    },
    [setBoard],
  );

  const renameMilestoneAction = useCallback(
    async (code: string, id: string, name: string) => {
      const updated = await client.renameMilestone(id, name);
      setBoard((prev) =>
        prev
          ? updateProject(prev, code, (p) =>
              updateMilestone(p, id, (m) => ({ ...m, name: updated.name })),
            )
          : prev,
      );
    },
    [setBoard],
  );

  const deleteMilestoneAction = useCallback(
    async (code: string, id: string) => {
      await client.deleteMilestone(id);
      setBoard((prev) =>
        prev
          ? updateProject(prev, code, (p) => ({
              ...p,
              milestones: p.milestones.filter((m) => m.id !== id),
            }))
          : prev,
      );
    },
    [setBoard],
  );

  const cycleMilestoneStatus = useCallback(
    async (id: string, monthIndex: number) => {
      if (!board) return;
      const found = findProjectAndMilestone(board, id);
      if (!found) return;
      const previous = found.milestone.statuses[monthIndex] ?? "";
      const next = nextProjectStatus(previous);

      setBoard((prev) =>
        prev
          ? updateProject(prev, found.project.code, (p) =>
              updateMilestone(p, id, (m) => {
                const statuses = [...m.statuses];
                statuses[monthIndex] = next;
                return { ...m, statuses };
              }),
            )
          : prev,
      );

      try {
        await client.setMilestoneStatus(id, monthIndex, next);
      } catch (error) {
        setBoard((prev) =>
          prev
            ? updateProject(prev, found.project.code, (p) =>
                updateMilestone(p, id, (m) => {
                  const statuses = [...m.statuses];
                  statuses[monthIndex] = previous;
                  return { ...m, statuses };
                }),
              )
            : prev,
        );
        throw error;
      }
    },
    [board, setBoard],
  );

  return {
    addMilestone,
    renameMilestone: renameMilestoneAction,
    deleteMilestone: deleteMilestoneAction,
    cycleMilestoneStatus,
  };
}
