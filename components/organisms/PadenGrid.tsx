import { berekenNiveau } from "@/lib/bereken-niveau";
import { PAD_IDS, PADEN } from "@/lib/data/paden";
import type { OntwikkelpadenState, PadId } from "@/types/ontwikkelpaden";

const NIVEAUS = [5, 4, 3, 2, 1] as const;

interface PadenGridProps {
  state: OntwikkelpadenState;
  onSetVorigJaar: (padId: PadId, n: number) => void;
}

export function PadenGrid({ state, onSetVorigJaar }: PadenGridProps) {
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
        const n = berekenNiveau(padId, state.scores);
        const vj = state.vorigJaar[padId];
        const heeftAmb = state.ambities[padId];
        const ambNiv = heeftAmb && n < 5 ? n + 1 : null;

        return (
          <div key={padId} className="pad-col">
            <div className={`pad-kop ${pad.kleur}`}>{pad.label}</div>
            <div className={`pad-as ${pad.kleur}`} />
            {NIVEAUS.map((niv) => {
              const rol = pad.rollen[niv - 1] ?? "";
              const isH = niv === n;
              const isV = niv === vj && niv !== n;
              const isA = ambNiv !== null && niv === ambNiv;
              const showPijl = isA && n > 0;

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
                      <div className="bol huidig" title={`Huidig: ${rol}`} />
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
