"use client";

import { useState } from "react";
import WijzigProjectCard from "@/components/organisms/WijzigProjectCard";
import type { VerbeterplanningActions } from "@/hooks/useVerbeterplanning";
import {
  RESULTAATGEBIEDEN,
  type Resultaatgebied,
} from "@/lib/verbeterplanning/constants";
import type { Project } from "@/lib/verbeterplanning/types";

interface WijzigTabProps {
  projects: Project[];
  actions: VerbeterplanningActions;
}

const EMPTY_FORM = {
  code: "",
  title: "",
  group: RESULTAATGEBIEDEN[0] as Resultaatgebied,
  mtlid: "",
  trekker: "",
  team: "",
  kpi: "",
};

export default function WijzigTab({ projects, actions }: WijzigTabProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const byGroup = new Map<string, Project[]>();
  for (const project of projects) {
    const list = byGroup.get(project.group) ?? [];
    list.push(project);
    byGroup.set(project.group, list);
  }

  async function handleAdd() {
    setError("");
    if (!form.code.trim() || !form.title.trim()) {
      setError("Projectcode en projectnaam zijn verplicht.");
      return;
    }
    try {
      await actions.addProject({
        code: form.code.trim(),
        title: form.title.trim(),
        group: form.group,
        mtlid: form.mtlid,
        trekker: form.trekker,
        team: form.team,
        kpi: form.kpi,
      });
      setForm(EMPTY_FORM);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Toevoegen mislukt");
    }
  }

  return (
    <div className="wijzig-wrap">
      <div className="wijzig-intro">
        Voeg een nieuw project toe, of wijzig MT-lid, trekker, projectteam en
        doelstelling van een bestaand project. Klik op een project om het uit te
        klappen.
      </div>

      <div className="wijzig-add-card">
        <div className="wijzig-add-title">+ Nieuw project toevoegen</div>
        <div className="wijzig-form-grid">
          <div className="wijzig-field">
            <label htmlFor="new-code">Projectcode</label>
            <input
              id="new-code"
              placeholder="bv. KMO09"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>
          <div className="wijzig-field">
            <label htmlFor="new-group">Resultaatgebied</label>
            <select
              id="new-group"
              value={form.group}
              onChange={(e) =>
                setForm({ ...form, group: e.target.value as Resultaatgebied })
              }
            >
              {RESULTAATGEBIEDEN.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="wijzig-form-grid full">
          <div className="wijzig-field">
            <label htmlFor="new-title">Projectnaam</label>
            <input
              id="new-title"
              placeholder="bv. Groeiplan Duitsland"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
        </div>
        <div className="wijzig-form-grid">
          <div className="wijzig-field">
            <label htmlFor="new-mtlid">MT-lid</label>
            <input
              id="new-mtlid"
              placeholder="bv. Ard"
              value={form.mtlid}
              onChange={(e) => setForm({ ...form, mtlid: e.target.value })}
            />
          </div>
          <div className="wijzig-field">
            <label htmlFor="new-trekker">Trekker</label>
            <input
              id="new-trekker"
              placeholder="bv. Judith"
              value={form.trekker}
              onChange={(e) => setForm({ ...form, trekker: e.target.value })}
            />
          </div>
        </div>
        <div className="wijzig-form-grid full">
          <div className="wijzig-field">
            <label htmlFor="new-team">Projectteam</label>
            <input
              id="new-team"
              placeholder="bv. Naam1, Naam2, Naam3"
              value={form.team}
              onChange={(e) => setForm({ ...form, team: e.target.value })}
            />
          </div>
        </div>
        <div className="wijzig-form-grid full">
          <div className="wijzig-field">
            <label htmlFor="new-kpi">Doelstelling / KPI</label>
            <textarea
              id="new-kpi"
              placeholder="Beschrijf de doelstelling…"
              value={form.kpi}
              onChange={(e) => setForm({ ...form, kpi: e.target.value })}
            />
          </div>
        </div>
        {error && (
          <div style={{ color: "var(--red)", fontSize: 11.5, marginBottom: 8 }}>
            {error}
          </div>
        )}
        <div className="wijzig-actions-row">
          <button
            type="button"
            className="btn-sm primary"
            onClick={() => void handleAdd()}
          >
            + Project toevoegen
          </button>
        </div>
      </div>

      {RESULTAATGEBIEDEN.map((group) => {
        const groupProjects = byGroup.get(group) ?? [];
        if (groupProjects.length === 0) return null;
        return (
          <div key={group}>
            <div className="wijzig-group-label">{group}</div>
            {groupProjects.map((project) => (
              <WijzigProjectCard
                key={project.code}
                project={project}
                onSave={(patch) =>
                  void actions.editProjectMeta(project.code, patch)
                }
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
