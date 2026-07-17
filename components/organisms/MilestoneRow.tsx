"use client";

import RagStatusButton from "@/components/atoms/RagStatusButton";
import { MONTHS } from "@/lib/verbeterplanning/constants";
import type { Milestone } from "@/lib/verbeterplanning/types";

interface MilestoneRowProps {
  milestone: Milestone;
  onCycleStatus: (monthIndex: number) => void;
}

export default function MilestoneRow({
  milestone,
  onCycleStatus,
}: MilestoneRowProps) {
  return (
    <tr className="milestone-row show">
      <td className="project-name">
        <span className="ms-name">↳ {milestone.name}</span>
      </td>
      {MONTHS.map(({ y, m }, monthIndex) => (
        <td className="status-cell" key={`${y}-${m}`}>
          <RagStatusButton
            status={milestone.statuses[monthIndex] ?? ""}
            size="sm"
            label={milestone.name}
            onClick={() => onCycleStatus(monthIndex)}
          />
        </td>
      ))}
    </tr>
  );
}
