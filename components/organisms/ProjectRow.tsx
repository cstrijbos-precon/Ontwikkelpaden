"use client";

import RagStatusButton from "@/components/atoms/RagStatusButton";
import { MONTHS } from "@/lib/verbeterplanning/constants";
import type { Project } from "@/lib/verbeterplanning/types";

interface ProjectRowProps {
  project: Project;
  milestonesVisible: boolean;
  onToggleMilestones: () => void;
  onRowClick: () => void;
  onCycleStatus: (monthIndex: number) => void;
}

export default function ProjectRow({
  project,
  milestonesVisible,
  onToggleMilestones,
  onRowClick,
  onCycleStatus,
}: ProjectRowProps) {
  return (
    <tr className="project-row" data-id={project.code} onClick={onRowClick}>
      <td className="project-name">
        <span className="proj-code">{project.code}</span>
        <span className="proj-title">{project.title}</span>
        <span className="proj-team">
          {project.mtlid} · {project.trekker}
          {project.team ? ` · ${project.team}` : ""}
        </span>
        {project.milestones.length > 0 && (
          <button
            type="button"
            className="ms-toggle-btn"
            style={{ border: "none", font: "inherit" }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMilestones();
            }}
          >
            {milestonesVisible
              ? "▾ milestones verbergen"
              : `▸ ${project.milestones.length} milestone${project.milestones.length === 1 ? "" : "s"}`}
          </button>
        )}
      </td>
      {MONTHS.map(({ y, m }, monthIndex) => (
        <td className="status-cell" key={`${y}-${m}`}>
          <RagStatusButton
            status={project.statuses[monthIndex] ?? ""}
            label={project.title}
            onClick={() => onCycleStatus(monthIndex)}
          />
        </td>
      ))}
    </tr>
  );
}
