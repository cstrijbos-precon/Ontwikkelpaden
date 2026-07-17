"use client";

import { useState } from "react";
import MilestoneListItem from "@/components/molecules/MilestoneListItem";
import KpiTrackingBlock from "@/components/organisms/KpiTrackingBlock";
import UpdatesList from "@/components/organisms/UpdatesList";
import type { VerbeterplanningActions } from "@/hooks/useVerbeterplanning";
import { MAX_MILESTONES_PER_PROJECT } from "@/lib/verbeterplanning/constants";
import type { Project } from "@/lib/verbeterplanning/types";

interface ProjectDetailPanelProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  actions: VerbeterplanningActions;
}

export default function ProjectDetailPanel({
  project,
  isOpen,
  onClose,
  actions,
}: ProjectDetailPanelProps) {
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState("");

  return (
    <div
      className={`detail-panel${isOpen ? " open" : ""}`}
      id={`detail-${project.code}`}
    >
      <div className="detail-header">
        <div>
          <div className="detail-title">
            {project.code} — {project.title}
          </div>
          <div className="detail-meta">
            MT-lid: {project.mtlid || "—"} · Trekker: {project.trekker || "—"}
            {project.team ? ` · Team: ${project.team}` : ""}
          </div>
        </div>
        <button
          type="button"
          className="close-btn"
          onClick={onClose}
          aria-label="Sluiten"
        >
          ✕
        </button>
      </div>

      {project.kpi && (
        <div className="doelstelling-block">
          {project.rg && <span className="rg-badge">{project.rg}</span>}
          <div className="kpi-text">{project.kpi}</div>
        </div>
      )}

      <KpiTrackingBlock
        kpis={project.kpis}
        onAddKpi={() => void actions.addKpi(project.code, "resultaat")}
        onEditKpi={(kpiId, patch) =>
          void actions.editKpi(project.code, kpiId, patch)
        }
        onDeleteKpi={(kpiId) => void actions.deleteKpi(project.code, kpiId)}
        onCycleKpiStatus={(kpiId, quarterIndex) =>
          void actions.cycleKpiStatus(kpiId, quarterIndex)
        }
        onChangeKpiNote={(kpiId, quarterIndex, note) =>
          actions.updateKpiNote(kpiId, quarterIndex, note)
        }
        onBlurKpiNote={(kpiId, quarterIndex, note) =>
          actions.flushKpiNote(kpiId, quarterIndex, note)
        }
      />

      <div className="kpi-block">
        <div className="kpi-block-header">
          <span className="section-label">Milestones</span>
          {!addingMilestone &&
            project.milestones.length < MAX_MILESTONES_PER_PROJECT && (
              <button
                type="button"
                className="add-ms-link"
                style={{ background: "none", border: "none", font: "inherit" }}
                onClick={() => setAddingMilestone(true)}
              >
                + milestone toevoegen
              </button>
            )}
        </div>
        {addingMilestone && (
          <div
            className="kpi-row"
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              padding: "8px 12px",
            }}
          >
            <input
              className="kpi-desc-input"
              placeholder="Naam van de milestone…"
              value={newMilestoneName}
              onChange={(e) => setNewMilestoneName(e.target.value)}
            />
            <button
              type="button"
              className="upd-action-icon"
              style={{ background: "none", border: "none", font: "inherit" }}
              onClick={() => {
                if (newMilestoneName.trim()) {
                  void actions.addMilestone(
                    project.code,
                    newMilestoneName.trim(),
                  );
                }
                setNewMilestoneName("");
                setAddingMilestone(false);
              }}
            >
              ✓ toevoegen
            </button>
            <button
              type="button"
              className="upd-action-icon"
              style={{ background: "none", border: "none", font: "inherit" }}
              onClick={() => {
                setNewMilestoneName("");
                setAddingMilestone(false);
              }}
            >
              ✕ annuleer
            </button>
          </div>
        )}
        {project.milestones.length === 0 && !addingMilestone && (
          <div className="kpi-empty-note">
            Nog geen milestones voor dit project. Voeg er een toe om als sub-rij
            in de tijdlijn te tonen.
          </div>
        )}
        {project.milestones.map((milestone) => (
          <MilestoneListItem
            key={milestone.id}
            milestone={milestone}
            onRename={(name) =>
              void actions.renameMilestone(project.code, milestone.id, name)
            }
            onDelete={() =>
              void actions.deleteMilestone(project.code, milestone.id)
            }
          />
        ))}
      </div>

      <UpdatesList
        updates={project.updates}
        onAdd={(text) => void actions.addUpdate(project.code, text)}
        onEdit={(id, text) => void actions.editUpdate(id, text)}
        onDelete={(id) => void actions.deleteUpdate(id)}
      />
    </div>
  );
}
