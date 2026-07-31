"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface AppHeaderProps {
  saveStatus: string;
  onSave: () => void;
  onExport: () => void;
}

export function AppHeader({ saveStatus, onSave, onExport }: AppHeaderProps) {
  return (
    <div className="header">
      <div className="header-top">
        <div className="header-logo">
          <div className="logo-box">P</div>
          <div>
            <div className="header-brand-title">Précon Consulting Group</div>
            <div className="header-brand-sub">
              Kwaliteitsmanagementsysteem · F-04
            </div>
          </div>
        </div>
        <div className="save-area">
          <span className="save-status">{saveStatus}</span>
          <Link href="/dashboard" className="btn btn-ghost-header">
            ← Dashboard
          </Link>
          <button
            type="button"
            className="btn btn-ghost-header"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Uitloggen
          </button>
          <button type="button" className="btn btn-w" onClick={onExport}>
            📄 Word export
          </button>
          <button type="button" className="btn btn-s" onClick={onSave}>
            💾 Opslaan
          </button>
        </div>
      </div>
      <div className="header-bottom">
        <h1>Précon persoonlijke ontwikkelpaden</h1>
      </div>
    </div>
  );
}
