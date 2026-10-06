import { useState } from "react";
import { PAD_IDS, PADEN } from "@/lib/data/paden";
import {
  type Aantallen,
  somPerCel,
  somPerPad,
  vervullingStatus,
  type WereldFilter,
} from "@/lib/vlootschouw/aggregatie";
import type { UpsertPlanningInput } from "@/lib/vlootschouw/planning";
import type { RolRij } from "@/lib/vlootschouw/types";

const NIVEAUS = [5, 4, 3, 2, 1] as const;

interface VlootschouwPlanningGridProps {
  rollen: RolRij[];
  wereldFilter: WereldFilter;
  onWijzig: (input: UpsertPlanningInput) => void;
}

function PlanningInput({
  label,
  waarde,
  onCommit,
}: {
  label: string;
  waarde: number;
  onCommit: (nieuweWaarde: number) => void;
}) {
  const [draft, setDraft] = useState(String(waarde));

  return (
    <input
      type="number"
      min={0}
      aria-label={label}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const nieuw = Number(draft);
        if (Number.isFinite(nieuw) && nieuw >= 0 && nieuw !== waarde) {
          onCommit(Math.round(nieuw));
        } else {
          setDraft(String(waarde));
        }
      }}
    />
  );
}

function StatusLabel({
  aanwezig,
  nodigNu,
}: Pick<Aantallen, "aanwezig" | "nodigNu">) {
  const { soort, verschil } = vervullingStatus(aanwezig, nodigNu);
  if (soort === "geen-norm") return null;
  const tekst =
    soort === "tekort"
      ? `${Math.abs(verschil)} tekort`
      : soort === "overschot"
        ? `${verschil} over`
        : "op sterkte";
  return <span className={`plan-status plan-status-${soort}`}>{tekst}</span>;
}

/**
 * Het framework (pad × niveau) als invulformulier. Per positie staat hoeveel
 * mensen er zijn (uit de gesprekken, niet te wijzigen) en hoeveel er nu en
 * straks nodig zijn.
 *
 * Invullen kan alleen met een wereld gekozen: de norm-cijfers worden per
 * (pad, niveau, wereld) bewaard. Bij "totaal" zie je de optelsom, die je niet
 * kunt bewerken — een getal invullen zou dan niet aan een wereld te hangen zijn.
 */
export function VlootschouwPlanningGrid({
  rollen,
  wereldFilter,
  onWijzig,
}: VlootschouwPlanningGridProps) {
  const bewerkbaar = wereldFilter !== "totaal";

  return (
    <div className="plan-grid">
      {/* Rij voor rij, zodat de niveau-labels en alle cellen vanzelf uitlijnen. */}
      <div />
      {PAD_IDS.map((padId) => (
        <div
          key={padId}
          className={`pad-kop plan-pad-kop ${PADEN[padId].kleur}`}
        >
          {PADEN[padId].label}
        </div>
      ))}

      {NIVEAUS.map((niveau) => (
        <PlanningRij
          key={niveau}
          niveau={niveau}
          rollen={rollen}
          wereldFilter={wereldFilter}
          bewerkbaar={bewerkbaar}
          onWijzig={onWijzig}
        />
      ))}

      <div />
      {PAD_IDS.map((padId) => {
        const pad = PADEN[padId];
        const totaal = somPerPad(rollen, padId, wereldFilter);
        return (
          <div
            key={padId}
            className="plan-totaal"
            data-testid={`totaal-${padId}`}
          >
            <div className="plan-totaal-kop">Totaal {pad.label}</div>
            <div className="plan-rij">
              <span>Aanwezig</span>
              <strong>{totaal.aanwezig}</strong>
            </div>
            <div className="plan-rij">
              <span>Nu nodig</span>
              <strong>{totaal.nodigNu}</strong>
            </div>
            <div className="plan-rij">
              <span>Straks nodig</span>
              <strong>{totaal.nodigStraks}</strong>
            </div>
            <StatusLabel aanwezig={totaal.aanwezig} nodigNu={totaal.nodigNu} />
          </div>
        );
      })}
    </div>
  );
}

function PlanningRij({
  niveau,
  rollen,
  wereldFilter,
  bewerkbaar,
  onWijzig,
}: {
  niveau: number;
  rollen: RolRij[];
  wereldFilter: WereldFilter;
  bewerkbaar: boolean;
  onWijzig: (input: UpsertPlanningInput) => void;
}) {
  return (
    <>
      <div className="plan-niv-lbl">{niveau}</div>
      {PAD_IDS.map((padId) => {
        const pad = PADEN[padId];
        const cel = somPerCel(rollen, padId, niveau, wereldFilter);
        const naam = `${pad.label} niveau ${niveau}`;

        function bewaar(patch: Partial<Aantallen>) {
          if (wereldFilter === "totaal") return;
          onWijzig({
            padId,
            niveau,
            wereld: wereldFilter,
            nodigNu: patch.nodigNu ?? cel.nodigNu,
            nodigStraks: patch.nodigStraks ?? cel.nodigStraks,
          });
        }

        return (
          <div key={padId} className="plan-cel">
            <div className="plan-rol">{pad.rollen[niveau - 1] ?? ""}</div>
            <div className="plan-rij">
              <span>Aanwezig</span>
              <strong className="plan-aanwezig">{cel.aanwezig}</strong>
            </div>
            <div className="plan-rij">
              <span>Nu nodig</span>
              {bewerkbaar ? (
                <PlanningInput
                  key={`${wereldFilter}-nu-${cel.nodigNu}`}
                  label={`${naam}, nu nodig`}
                  waarde={cel.nodigNu}
                  onCommit={(nodigNu) => bewaar({ nodigNu })}
                />
              ) : (
                <strong>{cel.nodigNu}</strong>
              )}
            </div>
            <div className="plan-rij">
              <span>Straks nodig</span>
              {bewerkbaar ? (
                <PlanningInput
                  key={`${wereldFilter}-straks-${cel.nodigStraks}`}
                  label={`${naam}, straks nodig`}
                  waarde={cel.nodigStraks}
                  onCommit={(nodigStraks) => bewaar({ nodigStraks })}
                />
              ) : (
                <strong>{cel.nodigStraks}</strong>
              )}
            </div>
            <StatusLabel aanwezig={cel.aanwezig} nodigNu={cel.nodigNu} />
          </div>
        );
      })}
    </>
  );
}
