import { useState } from "react";
import { padenVoor, padIdsVoor, type Variant, variantVan } from "@/lib/variant";
import {
  type Aantallen,
  reactiePerPad,
  somPerPad,
  verdelingPerCel,
  verdelingStatus,
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

function Percentage({ waarde }: { waarde: number | null }) {
  return (
    <span className="plan-pct">{waarde === null ? "—" : `${waarde}%`}</span>
  );
}

function VerdelingLabel({ verschilPunten }: { verschilPunten: number | null }) {
  const soort = verdelingStatus(verschilPunten);
  if (soort === "geen-data" || verschilPunten === null) return null;
  const tekst =
    soort === "op-niveau"
      ? "op niveau"
      : soort === "onder"
        ? `${Math.abs(verschilPunten)} pp onder gewenst`
        : `${verschilPunten} pp boven gewenst`;
  return <span className={`plan-status plan-status-${soort}`}>{tekst}</span>;
}

/**
 * Het framework (pad × niveau) als invulformulier. Per positie staat hoeveel
 * mensen er zijn (uit de gesprekken, niet te wijzigen) en hoeveel er nu en
 * straks nodig zijn, elk met het aandeel binnen het pad. Het verschil tussen
 * die twee aandelen (in procentpunten) laat zien waar de verdeling afwijkt
 * van de norm.
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
  const variant = variantVan(wereldFilter);
  const PADEN = padenVoor(variant);
  const PAD_IDS = padIdsVoor(variant);

  return (
    <div
      className="plan-grid"
      style={{ "--pad-kolommen": PAD_IDS.length } as React.CSSProperties}
    >
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
          variant={variant}
        />
      ))}

      <div />
      {PAD_IDS.map((padId) => {
        const pad = PADEN[padId];
        const totaal = somPerPad(rollen, padId, wereldFilter);
        const reactie = reactiePerPad(rollen, padId, wereldFilter);
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
            <div className="plan-reactie">
              {reactie.pct === null
                ? "Nog geen norm ingevuld"
                : `${reactie.ingeschaald} van ${reactie.nodig} ingeschaald (${reactie.pct}%)`}
            </div>
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
  variant,
}: {
  variant: Variant;
  niveau: number;
  rollen: RolRij[];
  wereldFilter: WereldFilter;
  bewerkbaar: boolean;
  onWijzig: (input: UpsertPlanningInput) => void;
}) {
  return (
    <>
      <div className="plan-niv-lbl">{niveau}</div>
      {padIdsVoor(variant).map((padId) => {
        const pad = padenVoor(variant)[padId];
        if (niveau > pad.rollen.length) return <div key={padId} />;
        const cel = verdelingPerCel(rollen, padId, niveau, wereldFilter);
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
              <span className="plan-waarde">
                <strong className="plan-aanwezig">{cel.aanwezig}</strong>
                <Percentage waarde={cel.aanwezigPct} />
              </span>
            </div>
            <div className="plan-rij">
              <span>Nu nodig</span>
              <span className="plan-waarde">
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
                <Percentage waarde={cel.gewenstPct} />
              </span>
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
            {/* Een niveau zonder mensen en zonder norm heeft niets om te melden. */}
            {!(cel.aanwezigPct === 0 && cel.gewenstPct === 0) && (
              <VerdelingLabel verschilPunten={cel.verschilPunten} />
            )}
          </div>
        );
      })}
    </>
  );
}
