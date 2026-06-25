import { COMPS } from "@/lib/data/competenties";
import { sterDisplay } from "@/lib/star-display";
import type { CompId } from "@/types/ontwikkelpaden";

interface CompetencyListProps {
  scores: Record<CompId, number>;
  opmerkingen: Record<CompId, string>;
  openComps: Set<string>;
  openSterren: Set<string>;
  onToggleComp: (id: string) => void;
  onToggleSter: (id: string) => void;
  onSetSter: (compId: CompId, n: number) => void;
  onUpdateOpmerking: (compId: CompId, value: string) => void;
}

export function CompetencyList({
  scores,
  opmerkingen,
  openComps,
  openSterren,
  onToggleComp,
  onToggleSter,
  onSetSter,
  onUpdateOpmerking,
}: CompetencyListProps) {
  return (
    <>
      {COMPS.map((comp) => {
        const sc = scores[comp.id];
        const stars = sterDisplay(sc);

        return (
          <div key={comp.id} className="comp-card">
            <button
              type="button"
              className="comp-header"
              onClick={() => onToggleComp(comp.id)}
            >
              <h3>
                {comp.label}
                {comp.trainerOnly && (
                  <span style={{ fontSize: 10, opacity: 0.7 }}>
                    {" "}
                    (Trainer-pad)
                  </span>
                )}
              </h3>
              <div className="comp-header-right">
                {sc > 0 && (
                  <span style={{ fontSize: 11, color: "#ffd080" }}>
                    {sc} ster{sc > 1 ? "ren" : ""}
                  </span>
                )}
                <span style={{ color: "#ffd080", fontSize: 16 }}>
                  {sc > 0 ? (
                    <>
                      {stars.filled}
                      <span style={{ opacity: 0.3 }}>{stars.empty}</span>
                    </>
                  ) : (
                    <span style={{ opacity: 0.3 }}>★★★★</span>
                  )}
                </span>
              </div>
            </button>
            <div className={`comp-body ${openComps.has(comp.id) ? "open" : ""}`}>
              <div className="comp-definitie-box">
                <div className="comp-definitie">{comp.definitie}</div>
                <div>
                  <strong className="comp-kernwoorden-label">
                    Kernwoorden:{" "}
                  </strong>
                  {comp.kernwoorden.join(" · ")}
                </div>
              </div>
              {comp.sterren.map((ster, si) => {
                const sterId = `sb-${comp.id}-${si}`;
                const selected = sc === si + 1;
                return (
                  <div key={sterId} className="ster-blok">
                    <button
                      type="button"
                      className={`ster-header ${selected ? "geselecteerd" : ""}`}
                      onClick={() => onToggleSter(sterId)}
                    >
                      <span className="ster-nr">{ster.label}</span>
                      <span className="ster-sym">{ster.sym}</span>
                      {selected && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--oranje)",
                            marginLeft: "auto",
                          }}
                        >
                          ✓ Mijn niveau
                        </span>
                      )}
                    </button>
                    <div
                      className={`ster-body ${openSterren.has(sterId) ? "open" : ""}`}
                    >
                      <div className="ster-intro">{ster.intro}</div>
                      <div className="gedragskader">
                        <div className="gedragskader-titel">
                          {ster.kaderTitel}
                        </div>
                        <ul>
                          {ster.gedrag.map((g) => (
                            <li key={g}>{g}</li>
                          ))}
                        </ul>
                      </div>
                      <button
                        type="button"
                        className={`selecteer-btn ${selected ? "actief" : ""}`}
                        onClick={() => onSetSter(comp.id, si + 1)}
                      >
                        {selected
                          ? "✓ Dit is mijn niveau"
                          : "Selecteer als mijn niveau"}
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="opm-veld">
                <label>Toelichting / opmerkingen bij {comp.label}</label>
                <textarea
                  placeholder="Notities, voorbeelden, afspraken..."
                  value={opmerkingen[comp.id]}
                  onChange={(e) => onUpdateOpmerking(comp.id, e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
