"use client";

import { useNiveauSleep } from "@/hooks/useNiveauSleep";
import { PAD_IDS, PADEN } from "@/lib/data/paden";
import { effectiefNiveau } from "@/lib/effectief-niveau";
import type { OntwikkelpadenState, PadId } from "@/types/ontwikkelpaden";

const NIVEAUS = [5, 4, 3, 2, 1] as const;
const MAX_NIVEAU = 5;
const MIN_NIVEAU = 1;

interface PadenGridProps {
  state: OntwikkelpadenState;
  onSetVorigJaar: (padId: PadId, n: number) => void;
  onSetNiveauCorrectie: (padId: PadId, niveau: number | null) => void;
}

export function PadenGrid({
  state,
  onSetVorigJaar,
  onSetNiveauCorrectie,
}: PadenGridProps) {
  const { sleep, registreerBaan, startSleep } =
    useNiveauSleep(onSetNiveauCorrectie);

  return (
    <div className="paden-grid">
      <div className="niv-col">
        {NIVEAUS.map((n) => (
          <div key={n} className="niv-lbl">
            {n}
          </div>
        ))}
      </div>
      {PAD_IDS.map((padId) => {
        const pad = PADEN[padId];
        const n = effectiefNiveau(padId, state);
        const vj = state.vorigJaar[padId];
        const heeftAmb = state.ambities[padId];
        const ambNiv = heeftAmb && n < 5 ? n + 1 : null;
        const isVerschoven = state.niveauCorrectie[padId] !== null;

        const sleeptHier = sleep?.padId === padId;
        const toonNiveau = sleeptHier ? sleep.niveau : n;

        const verplaats = (richting: 1 | -1) => {
          const doel = Math.min(
            MAX_NIVEAU,
            Math.max(MIN_NIVEAU, (n || MIN_NIVEAU) + richting),
          );
          onSetNiveauCorrectie(padId, doel);
        };

        return (
          <div key={padId} className="pad-col">
            <div className={`pad-kop ${pad.kleur}`}>{pad.label}</div>
            <div className={`pad-as ${pad.kleur}`} />
            <div className="niv-baan" ref={registreerBaan(padId)}>
              {NIVEAUS.map((niv) => {
                const rol = pad.rollen[niv - 1] ?? "";
                const isH = niv === toonNiveau;
                const isV = niv === vj && niv !== toonNiveau;
                const isA = ambNiv !== null && niv === ambNiv && !sleeptHier;
                const showPijl = isA && n > 0;
                const isLeegDoel = toonNiveau === 0 && niv === MIN_NIVEAU;

                return (
                  <div key={niv} className="niv-cel">
                    {showPijl && (
                      <div
                        style={{
                          position: "absolute",
                          left: "50%",
                          transform: "translateX(-50%)",
                          top: 0,
                          height: "100%",
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "center",
                          zIndex: 8,
                          pointerEvents: "none",
                        }}
                      >
                        <svg
                          width="20"
                          height="110"
                          style={{ overflow: "visible" }}
                          role="presentation"
                          aria-hidden="true"
                        >
                          <title>Verbindingslijn tussen niveaus</title>
                          <defs>
                            <marker
                              id={`mh-${padId}`}
                              viewBox="0 0 8 8"
                              refX="4"
                              refY="4"
                              markerWidth="5"
                              markerHeight="5"
                              orient="auto"
                            >
                              <path d="M0,0 L8,4 L0,8 Z" fill="var(--oranje)" />
                            </marker>
                          </defs>
                          <line
                            x1="10"
                            y1="110"
                            x2="10"
                            y2="5"
                            stroke="var(--oranje)"
                            strokeWidth="2.5"
                            strokeDasharray="5,3"
                            markerEnd={`url(#mh-${padId})`}
                          />
                        </svg>
                      </div>
                    )}
                    <div className="bol-wrap">
                      {isA && (
                        <div
                          className="bol ambitie-bol"
                          title={`Ambitie: ${rol}`}
                        />
                      )}
                      {isH && (
                        <button
                          type="button"
                          className={`bol huidig sleepbaar${
                            sleeptHier ? " sleept" : ""
                          }${isVerschoven ? " verschoven" : ""}`}
                          onPointerDown={startSleep(padId, n || MIN_NIVEAU)}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowUp") {
                              e.preventDefault();
                              verplaats(1);
                            } else if (e.key === "ArrowDown") {
                              e.preventDefault();
                              verplaats(-1);
                            }
                          }}
                          aria-label={`${pad.label}: niveau ${toonNiveau} – ${rol}. Sleep of gebruik pijltjestoetsen om het niveau te verschuiven.`}
                          title={`${isVerschoven ? "Handmatig gezet" : "Huidig"}: ${rol} — sleep om te verschuiven`}
                        />
                      )}
                      {isLeegDoel && (
                        <button
                          type="button"
                          className="bol plaatsbaar"
                          onClick={() =>
                            onSetNiveauCorrectie(padId, MIN_NIVEAU)
                          }
                          onPointerDown={startSleep(padId, MIN_NIVEAU)}
                          aria-label={`${pad.label}: nog niet ingeschaald. Klik of sleep om handmatig een niveau te kiezen.`}
                          title="Nog niet ingeschaald — klik of sleep om een niveau te kiezen"
                        />
                      )}
                      {isV && (
                        <div
                          className="bol vorig"
                          title={`Vorig jaar: ${pad.rollen[vj - 1]}`}
                        />
                      )}
                    </div>
                    <span className="rol-naam">{rol}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "6px 0", textAlign: "center" }}>
              <select
                style={{
                  fontSize: "10.5px",
                  border: "1px solid var(--grijs-lijn)",
                  borderRadius: 4,
                  padding: 3,
                  color: "var(--grijs)",
                }}
                value={vj}
                onChange={(e) =>
                  onSetVorigJaar(padId, Number.parseInt(e.target.value, 10))
                }
              >
                <option value={0}>Vorig jaar —</option>
                {[1, 2, 3, 4, 5].map((nv) => (
                  <option key={nv} value={nv}>
                    {nv} – {pad.rollen[nv - 1]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
