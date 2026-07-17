"use client";

import { useCallback } from "react";
import { updateProject } from "@/hooks/verbeterplanning/board-helpers";
import {
  MONTHS,
  nextProjectStatus,
  type ProjectMonthStatusOrEmpty,
} from "@/lib/verbeterplanning/constants";
import type {
  CreateProjectInput,
  UpdateProjectMetaInput,
} from "@/lib/verbeterplanning/projects";
import type { VerbeterplanningBoard } from "@/lib/verbeterplanning/types";
import * as client from "@/services/verbeterplanning-client";

type SetBoard = React.Dispatch<
  React.SetStateAction<VerbeterplanningBoard | null>
>;

export function useProjectMutations(
  board: VerbeterplanningBoard | null,
  setBoard: SetBoard,
) {
  const addProject = useCallback(
    async (input: CreateProjectInput) => {
      const created = await client.createProject(input);
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          projects: [
            ...prev.projects,
            {
              ...created,
              statuses: new Array<ProjectMonthStatusOrEmpty>(
                MONTHS.length,
              ).fill(""),
              milestones: [],
              kpis: [],
              updates: [],
            },
          ],
        };
      });
    },
    [setBoard],
  );

  const editProjectMeta = useCallback(
    async (code: string, patch: UpdateProjectMetaInput) => {
      const updated = await client.updateProjectMeta(code, patch);
      setBoard((prev) =>
        prev ? updateProject(prev, code, (p) => ({ ...p, ...updated })) : prev,
      );
    },
    [setBoard],
  );

  const cycleProjectStatus = useCallback(
    async (code: string, monthIndex: number) => {
      if (!board) return;
      const project = board.projects.find((p) => p.code === code);
      const previous = project?.statuses[monthIndex] ?? "";
      const next = nextProjectStatus(previous);

      setBoard((prev) =>
        prev
          ? updateProject(prev, code, (p) => {
              const statuses = [...p.statuses];
              statuses[monthIndex] = next;
              return { ...p, statuses };
            })
          : prev,
      );

      try {
        await client.setProjectStatus(code, monthIndex, next);
      } catch (error) {
        setBoard((prev) =>
          prev
            ? updateProject(prev, code, (p) => {
                const statuses = [...p.statuses];
                statuses[monthIndex] = previous;
                return { ...p, statuses };
              })
            : prev,
        );
        throw error;
      }
    },
    [board, setBoard],
  );

  return { addProject, editProjectMeta, cycleProjectStatus };
}
