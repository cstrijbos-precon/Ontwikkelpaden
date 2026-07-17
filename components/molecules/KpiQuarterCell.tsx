"use client";

import { useState } from "react";
import RagStatusButton from "@/components/atoms/RagStatusButton";
import type { KpiQuarter } from "@/lib/verbeterplanning/types";

interface KpiQuarterCellProps {
  label: string;
  quarter: KpiQuarter;
  onCycleStatus: () => void;
  onChangeNote: (note: string) => void;
  onBlurNote: () => void;
}

export default function KpiQuarterCell({
  label,
  quarter,
  onCycleStatus,
  onChangeNote,
  onBlurNote,
}: KpiQuarterCellProps) {
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <div className="kpi-q">
      <span className="kpi-q-label">{label}</span>
      <RagStatusButton
        status={quarter.status}
        size="sm"
        label={label}
        onClick={onCycleStatus}
      />
      <button
        type="button"
        className="kpi-note-toggle"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          font: "inherit",
        }}
        onClick={() => setNotesOpen((v) => !v)}
        aria-label={`Opmerking ${label}`}
      >
        📝
      </button>
      {notesOpen && (
        <div className="kpi-note-area open" style={{ width: 180 }}>
          <textarea
            value={quarter.note}
            placeholder="Opmerking…"
            onChange={(e) => onChangeNote(e.target.value)}
            onBlur={onBlurNote}
          />
        </div>
      )}
    </div>
  );
}
