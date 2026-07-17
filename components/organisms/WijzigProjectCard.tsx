"use client";

import { useState } from "react";
import { RESULTAATGEBIEDEN } from "@/lib/verbeterplanning/constants";
import type { UpdateProjectMetaInput } from "@/lib/verbeterplanning/projects";
import type { Project } from "@/lib/verbeterplanning/types";

interface WijzigProjectCardProps {
  project: Project;
  onSave: (patch: UpdateProjectMetaInput) => void;
}

export default function WijzigProjectCard({
  project,
  onSave,
}: WijzigProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [mtlid, setMtlid] = useState(project.mtlid);
  const [trekker, setTrekker] = useState(project.trekker);
  const [team, setTeam] = useState(project.team);
  const [rg, setRg] = useState(project.rg);
  const [kpi, setKpi] = useState(project.kpi);

  return (
    <div className={`wijzig-project-card${expanded ? " expanded" : ""}`}>
      <button
        type="button"
        className="wijzig-project-header"
        style={{
          border: "none",
          width: "100%",
          textAlign: "left",
          font: "inherit",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="wijzig-ph-left">
          <span className="wijzig-ph-code">{project.code}</span>
          <span className="wijzig-ph-title">{project.title}</span>
        </div>
        <span className="wijzig-chevron">▸</span>
      </button>
      {expanded && (
        <div className="wijzig-project-body">
          <div className="wijzig-form-grid">
            <div className="wijzig-field">
              <label htmlFor={`title-${project.code}`}>Projectnaam</label>
              <input
                id={`title-${project.code}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="wijzig-field">
              <label htmlFor={`rg-${project.code}`}>
                Resultaatgebied / type
              </label>
              <select
                id={`rg-${project.code}`}
                value={rg}
                onChange={(e) => setRg(e.target.value)}
              >
                {RESULTAATGEBIEDEN.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                {!RESULTAATGEBIEDEN.includes(
                  rg as (typeof RESULTAATGEBIEDEN)[number],
                ) &&
                  rg && <option value={rg}>{rg}</option>}
              </select>
            </div>
          </div>
          <div className="wijzig-form-grid">
            <div className="wijzig-field">
              <label htmlFor={`mtlid-${project.code}`}>MT-lid</label>
              <input
                id={`mtlid-${project.code}`}
                value={mtlid}
                onChange={(e) => setMtlid(e.target.value)}
              />
            </div>
            <div className="wijzig-field">
              <label htmlFor={`trekker-${project.code}`}>Trekker</label>
              <input
                id={`trekker-${project.code}`}
                value={trekker}
                onChange={(e) => setTrekker(e.target.value)}
              />
            </div>
          </div>
          <div className="wijzig-form-grid full">
            <div className="wijzig-field">
              <label htmlFor={`team-${project.code}`}>Projectteam</label>
              <input
                id={`team-${project.code}`}
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              />
            </div>
          </div>
          <div className="wijzig-form-grid full">
            <div className="wijzig-field">
              <label htmlFor={`kpi-${project.code}`}>Doelstelling / KPI</label>
              <textarea
                id={`kpi-${project.code}`}
                value={kpi}
                onChange={(e) => setKpi(e.target.value)}
              />
            </div>
          </div>
          <div className="wijzig-actions-row">
            <button
              type="button"
              className="btn-sm primary"
              onClick={() => onSave({ title, mtlid, trekker, team, rg, kpi })}
            >
              Wijzigingen opslaan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
