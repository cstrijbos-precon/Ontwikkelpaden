"use client";

import { useState } from "react";
import type { Update } from "@/lib/verbeterplanning/types";

interface UpdateListItemProps {
  update: Update;
  onEdit: (text: string) => void;
  onDelete: () => void;
}

const actionButtonStyle = {
  background: "none",
  border: "none",
  padding: 0,
  font: "inherit",
} as const;

export default function UpdateListItem({
  update,
  onEdit,
  onDelete,
}: UpdateListItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(update.text);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const dateLabel = new Date(update.createdAt).toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (editing) {
    return (
      <li>
        <div className="upd-date">{dateLabel}</div>
        <textarea
          className="upd-text"
          style={{ width: "100%", fontFamily: "inherit" }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="upd-actions" style={{ marginTop: 6 }}>
          <button
            type="button"
            className="upd-action-icon"
            style={actionButtonStyle}
            onClick={() => {
              onEdit(draft);
              setEditing(false);
            }}
          >
            ✓ opslaan
          </button>
          <button
            type="button"
            className="upd-action-icon"
            style={actionButtonStyle}
            onClick={() => {
              setDraft(update.text);
              setEditing(false);
            }}
          >
            ✕ annuleren
          </button>
        </div>
      </li>
    );
  }

  return (
    <li>
      <div className="upd-date">
        <span>{dateLabel}</span>
        <span className="upd-actions">
          <button
            type="button"
            className="upd-action-icon"
            style={actionButtonStyle}
            onClick={() => setEditing(true)}
          >
            ✎ bewerk
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
      <div className="upd-text">{update.text}</div>
    </li>
  );
}
