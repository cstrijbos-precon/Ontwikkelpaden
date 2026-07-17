"use client";

import { useCallback, useState } from "react";
import StatusLegendDot from "@/components/atoms/StatusLegendDot";
import AgendaTab from "@/components/organisms/AgendaTab";
import TimelineTable from "@/components/organisms/TimelineTable";
import VerbeterplanningExportBar from "@/components/organisms/VerbeterplanningExportBar";
import WijzigTab from "@/components/organisms/WijzigTab";
import { useVerbeterplanning } from "@/hooks/useVerbeterplanning";

type Tab = "tijdlijn" | "agenda" | "wijzig";

export default function VerbeterplanningApp() {
  const { board, hydrated, loadError, refresh, ...actions } =
    useVerbeterplanning();
  const [tab, setTab] = useState<Tab>("tijdlijn");
  const [collapseSignal, setCollapseSignal] = useState(0);

  const collapseAll = useCallback(() => setCollapseSignal((n) => n + 1), []);

  if (!hydrated) {
    return (
      <div
        className="vp-root"
        style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}
      >
        Bezig met laden…
      </div>
    );
  }

  if (loadError || !board) {
    return (
      <div
        className="vp-root"
        style={{ padding: 40, textAlign: "center", color: "var(--red)" }}
      >
        {loadError || "Onbekende fout bij laden."}
      </div>
    );
  }

  return (
    <div className="vp-root">
      <header>
        <div>
          <div className="logo">
            Pré<span>con</span> — Verbeterplanning
          </div>
          <div className="subtitle">
            Tijdlijn &amp; Voortgang · Klaar voor de toekomst
          </div>
        </div>
        <VerbeterplanningExportBar
          board={board}
          onCollapseAll={collapseAll}
          onRefresh={() => void refresh()}
        />
      </header>

      <div className="tabs">
        <button
          type="button"
          className={`tab-btn${tab === "tijdlijn" ? " active" : ""}`}
          onClick={() => setTab("tijdlijn")}
        >
          📅 Tijdlijn
        </button>
        <button
          type="button"
          className={`tab-btn${tab === "agenda" ? " active" : ""}`}
          onClick={() => setTab("agenda")}
        >
          🗓 Agendaplanning
        </button>
        <button
          type="button"
          className={`tab-btn${tab === "wijzig" ? " active" : ""}`}
          onClick={() => setTab("wijzig")}
        >
          ✏️ Wijzigingen in projecten
        </button>
      </div>

      {tab === "tijdlijn" && (
        <div className="legend">
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--navy)",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Status:
          </span>
          <StatusLegendDot variant="green" label="Op koers" />
          <StatusLegendDot variant="amber" label="Aandacht nodig" />
          <StatusLegendDot variant="red" label="Achter / knelpunt" />
          <StatusLegendDot variant="purple" label="Gepland" />
          <StatusLegendDot variant="empty" label="Nog niet ingevoerd" />
          <span
            style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}
          >
            Klik op project voor updates &amp; KPI's · "▸ milestones" voor
            sub-tijdlijn
          </span>
        </div>
      )}

      {tab === "tijdlijn" && (
        <div className="tab-panel active">
          <div className="table-wrap">
            <TimelineTable
              projects={board.projects}
              actions={actions}
              collapseSignal={collapseSignal}
            />
          </div>
        </div>
      )}

      {tab === "agenda" && (
        <div className="tab-panel active">
          <AgendaTab agenda={board.agenda} actions={actions} />
        </div>
      )}

      {tab === "wijzig" && (
        <div className="tab-panel active">
          <WijzigTab projects={board.projects} actions={actions} />
        </div>
      )}
    </div>
  );
}
