"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import MonthHeaderRow from "@/components/molecules/MonthHeaderRow";
import MilestoneRow from "@/components/organisms/MilestoneRow";
import ProjectDetailPanel from "@/components/organisms/ProjectDetailPanel";
import ProjectRow from "@/components/organisms/ProjectRow";
import type { VerbeterplanningActions } from "@/hooks/useVerbeterplanning";
import { MONTHS, RESULTAATGEBIEDEN } from "@/lib/verbeterplanning/constants";
import type { Project } from "@/lib/verbeterplanning/types";

interface TimelineTableProps {
  projects: Project[];
  actions: VerbeterplanningActions;
  collapseSignal: number;
}

function groupProjects(projects: Project[]): Map<string, Project[]> {
  const byGroup = new Map<string, Project[]>();
  for (const project of projects) {
    const list = byGroup.get(project.group) ?? [];
    list.push(project);
    byGroup.set(project.group, list);
  }
  return byGroup;
}

export default function TimelineTable({
  projects,
  actions,
  collapseSignal,
}: TimelineTableProps) {
  const [openDetailCode, setOpenDetailCode] = useState<string | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (collapseSignal === 0) return;
    setOpenDetailCode(null);
    setExpandedMilestones(new Set());
  }, [collapseSignal]);

  const toggleMilestones = useCallback((code: string) => {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  const byGroup = groupProjects(projects);

  return (
    <table id="timeline">
      <MonthHeaderRow />
      <tbody>
        {RESULTAATGEBIEDEN.map((group) => {
          const groupProjects = byGroup.get(group) ?? [];
          if (groupProjects.length === 0) return null;

          return (
            <Fragment key={group}>
              <tr className="group-row">
                <td colSpan={MONTHS.length + 1}>{group}</td>
              </tr>
              {groupProjects.map((project) => (
                <Fragment key={project.code}>
                  <ProjectRow
                    project={project}
                    milestonesVisible={expandedMilestones.has(project.code)}
                    onToggleMilestones={() => toggleMilestones(project.code)}
                    onRowClick={() =>
                      setOpenDetailCode((prev) =>
                        prev === project.code ? null : project.code,
                      )
                    }
                    onCycleStatus={(monthIndex) =>
                      void actions.cycleProjectStatus(project.code, monthIndex)
                    }
                  />
                  {expandedMilestones.has(project.code) &&
                    project.milestones.map((milestone) => (
                      <MilestoneRow
                        key={milestone.id}
                        milestone={milestone}
                        onCycleStatus={(monthIndex) =>
                          void actions.cycleMilestoneStatus(
                            milestone.id,
                            monthIndex,
                          )
                        }
                      />
                    ))}
                  <tr className="detail-row">
                    <td colSpan={MONTHS.length + 1}>
                      <ProjectDetailPanel
                        project={project}
                        isOpen={openDetailCode === project.code}
                        onClose={() => setOpenDetailCode(null)}
                        actions={actions}
                      />
                    </td>
                  </tr>
                </Fragment>
              ))}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
