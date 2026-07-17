"use client";

import KpiQuarterCell from "@/components/molecules/KpiQuarterCell";
import {
  KPI_QUARTERS,
  type KpiType,
  MAX_KPIS_PER_PROJECT,
} from "@/lib/verbeterplanning/constants";
import type { Kpi } from "@/lib/verbeterplanning/types";

interface KpiTrackingBlockProps {
  kpis: Kpi[];
  onAddKpi: () => void;
  onEditKpi: (
    kpiId: string,
    patch: { type?: KpiType; description?: string },
  ) => void;
  onDeleteKpi: (kpiId: string) => void;
  onCycleKpiStatus: (kpiId: string, quarterIndex: number) => void;
  onChangeKpiNote: (kpiId: string, quarterIndex: number, note: string) => void;
  onBlurKpiNote: (kpiId: string, quarterIndex: number, note: string) => void;
}

export default function KpiTrackingBlock({
  kpis,
  onAddKpi,
  onEditKpi,
  onDeleteKpi,
  onCycleKpiStatus,
  onChangeKpiNote,
  onBlurKpiNote,
}: KpiTrackingBlockProps) {
  return (
    <div className="kpi-block">
      <div className="kpi-block-header">
        <span className="section-label">KPI-tracking</span>
      </div>

      {kpis.length === 0 && (
        <div className="kpi-empty-note">Nog geen KPI's voor dit project.</div>
      )}

      {kpis.map((kpi) => (
        <div className="kpi-row" key={kpi.id}>
          <div className="kpi-row-top">
            <select
              className="kpi-type-select"
              value={kpi.type}
              onChange={(e) =>
                onEditKpi(kpi.id, { type: e.target.value as KpiType })
              }
            >
              <option value="activiteit">Activiteit</option>
              <option value="resultaat">Resultaat</option>
            </select>
            <input
              className="kpi-desc-input"
              placeholder="Beschrijf de KPI…"
              defaultValue={kpi.description}
              onBlur={(e) => onEditKpi(kpi.id, { description: e.target.value })}
            />
            <button
              type="button"
              className="kpi-remove-btn"
              style={{ background: "none", border: "none", font: "inherit" }}
              onClick={() => onDeleteKpi(kpi.id)}
            >
              ✕ verwijder
            </button>
          </div>
          <div className="kpi-quarters">
            {KPI_QUARTERS.map((label, quarterIndex) => {
              const quarter = kpi.quarters[quarterIndex];
              if (!quarter) return null;
              return (
                <KpiQuarterCell
                  key={label}
                  label={label}
                  quarter={quarter}
                  onCycleStatus={() => onCycleKpiStatus(kpi.id, quarterIndex)}
                  onChangeNote={(note) =>
                    onChangeKpiNote(kpi.id, quarterIndex, note)
                  }
                  onBlurNote={() =>
                    onBlurKpiNote(kpi.id, quarterIndex, quarter.note)
                  }
                />
              );
            })}
          </div>
        </div>
      ))}

      {kpis.length < MAX_KPIS_PER_PROJECT && (
        <button
          type="button"
          className="add-kpi-row"
          style={{ background: "none", border: "none", font: "inherit" }}
          onClick={onAddKpi}
        >
          + KPI toevoegen
        </button>
      )}
    </div>
  );
}
