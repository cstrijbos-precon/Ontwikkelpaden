import { FormField } from "@/components/molecules/FormField";
import { ScoreBox } from "@/components/molecules/ScoreBox";
import { berekenNiveau } from "@/lib/bereken-niveau";
import { PAD_IDS, PADEN } from "@/lib/data/paden";
import { TRAININGSGROEPEN } from "@/lib/data/training-groups";
import { getPadColor } from "@/lib/pad-colors";
import type { OntwikkelpadenState, PadId } from "@/types/ontwikkelpaden";

interface ScreenAmbitieProps {
  state: OntwikkelpadenState;
  onUpdate: <K extends keyof OntwikkelpadenState>(
    key: K,
    value: OntwikkelpadenState[K],
  ) => void;
  onToggleAmbitie: (padId: PadId) => void;
  onSetTrainingsgroep: (padId: PadId, value: string) => void;
}

export function ScreenAmbitie({
  state,
  onUpdate,
  onToggleAmbitie,
  onSetTrainingsgroep,
}: ScreenAmbitieProps) {
  return (
    <>
      <div className="scherm-titel">Ambitie</div>
      <div className="scherm-sub">
        Waar wil je naartoe? Je kunt ambitie tonen op meerdere paden.
      </div>
      <div className="info-box">
        <strong>Maximaal 1 stap per pad per jaar</strong> is realistisch. De
        ambitiepijl verschijnt op de paden in scherm 6. Je kiest ook de
        trainingsgroep die bij je ambitie past.
      </div>
      <ScoreBox state={state} />
      <div className="sk">Kies je ambitie per pad</div>
      <div className="ambitie-grid">
        {PAD_IDS.map((padId) => {
          const pad = PADEN[padId];
          const n = berekenNiveau(padId, state.scores);
          const heeftAmbitie = state.ambities[padId];
          const volg = n < 5 ? n + 1 : null;

          return (
            <div
              key={padId}
              className={`ambitie-card ${heeftAmbitie ? "actief" : ""}`}
            >
              <div className="ambitie-toggle">
                <input
                  type="checkbox"
                  id={`amb-${padId}`}
                  checked={heeftAmbitie}
                  disabled={n >= 5}
                  onChange={() => onToggleAmbitie(padId)}
                />
                <label
                  htmlFor={`amb-${padId}`}
                  style={{
                    fontWeight: "bold",
                    color: getPadColor(padId),
                    cursor: "pointer",
                  }}
                >
                  {pad.label}
                </label>
              </div>
              <div className="ambitie-niv-info">
                Nu:{" "}
                <strong style={{ color: "var(--blauw)" }}>
                  {n > 0
                    ? `Niveau ${n} – ${pad.rollen[n - 1]}`
                    : "Nog niet ingeschaald"}
                </strong>
                <br />
                {volg ? (
                  <>
                    Ambitie:{" "}
                    <strong style={{ color: "var(--oranje)" }}>
                      Niveau {volg} – {pad.rollen[volg - 1]}
                    </strong>
                  </>
                ) : (
                  <span style={{ color: "var(--groen)" }}>
                    ✓ Hoogste niveau bereikt!
                  </span>
                )}
              </div>
              {heeftAmbitie && volg && (
                <div style={{ marginTop: 10 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: "bold",
                      color: "var(--blauw)",
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Trainingsgroep
                  </div>
                  <select
                    value={state.trainingsgroepen[padId]}
                    onChange={(e) => onSetTrainingsgroep(padId, e.target.value)}
                    style={{
                      width: "100%",
                      fontFamily: "Arial, sans-serif",
                      fontSize: 12,
                      border: "1.5px solid var(--grijs-lijn)",
                      borderRadius: 5,
                      padding: "5px 8px",
                    }}
                  >
                    <option value="">— Kies trainingsgroep —</option>
                    {TRAININGSGROEPEN[padId].map((tg) => (
                      <option key={tg.id} value={tg.id}>
                        {tg.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <FormField label="Omschrijving ambitie (in eigen woorden)">
        <textarea
          rows={5}
          placeholder="Omschrijf je ambities voor komend jaar..."
          value={state.ambitieNotitie}
          onChange={(e) => onUpdate("ambitieNotitie", e.target.value)}
        />
      </FormField>
    </>
  );
}
