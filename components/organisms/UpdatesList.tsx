"use client";

import { useState } from "react";
import UpdateListItem from "@/components/molecules/UpdateListItem";
import type { Update } from "@/lib/verbeterplanning/types";

interface UpdatesListProps {
  updates: Update[];
  onAdd: (text: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

export default function UpdatesList({
  updates,
  onAdd,
  onEdit,
  onDelete,
}: UpdatesListProps) {
  const [draft, setDraft] = useState("");

  return (
    <div>
      <span className="section-label">Updates</span>
      <ul className="updates-list">
        {updates.map((update) => (
          <UpdateListItem
            key={update.id}
            update={update}
            onEdit={(text) => onEdit(update.id, text)}
            onDelete={() => onDelete(update.id)}
          />
        ))}
      </ul>
      <div className="update-form">
        <textarea
          placeholder="Nieuwe update…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="button"
          className="btn-sm primary"
          onClick={() => {
            if (!draft.trim()) return;
            onAdd(draft.trim());
            setDraft("");
          }}
        >
          Opslaan
        </button>
      </div>
    </div>
  );
}
