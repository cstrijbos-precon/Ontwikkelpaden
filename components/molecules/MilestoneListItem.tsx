"use client";

import { useState } from "react";
import type { Milestone } from "@/lib/verbeterplanning/types";

interface MilestoneListItemProps {
  milestone: Milestone;
  onRename: (name: string) => void;
  onDelete: () => void;
}

const actionButtonStyle = {
  background: "none",
  border: "none",
  padding: 0,
  font: "inherit",
} as const;

export default function MilestoneListItem({
  milestone,
  onRename,
  onDelete,
}: MilestoneListItemProps) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(milestone.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (renaming) {
    return (
      <div
        className="kpi-row"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
        }}
      >
        <input
          className="kpi-desc-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="button"
          className="upd-action-icon"
          style={actionButtonStyle}
          onClick={() => {
            if (draft.trim()) onRename(draft.trim());
            setRenaming(false);
          }}
        >
          ✓
        </button>
        <button
          type="button"
          className="upd-action-icon"
          style={actionButtonStyle}
          onClick={() => {
            setDraft(milestone.name);
            setRenaming(false);
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      className="kpi-row"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
      }}
    >
      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--navy)" }}>
        ↳ {milestone.name}
      </span>
      <span style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          className="upd-action-icon"
          style={actionButtonStyle}
          onClick={() => setRenaming(true)}
        >
          ✎ hernoem
        </button>
        {confirmingDelete ? (
          <>
            <button
              type="button"
              className="upd-action-icon danger"
              style={actionButtonStyle}
              onClick={onDelete}
            >
              zeker weten?
            </button>
            <button
              type="button"
              className="upd-action-icon"
              style={actionButtonStyle}
              onClick={() => setConfirmingDelete(false)}
            >
              annuleer
            </button>
          </>
        ) : (
          <button
            type="button"
            className="upd-action-icon danger"
            style={actionButtonStyle}
            onClick={() => setConfirmingDelete(true)}
          >
            🗑 verwijder
          </button>
        )}
      </span>
    </div>
  );
}
