"use client";

import { useEffect, useState } from "react";
import type { Trainingslijn } from "@/app/api/trainingslijnen/route";
import { FormField } from "@/components/molecules/FormField";
import { fetchTrainingslijnen } from "@/services/gesprekken-client";
import type { TrainingslijnReflectie } from "@/types/ontwikkelpaden";

interface TrainingslijnReflectieBlokProps {
  gevolgdeTrainingslijnen: string[];
  trainingslijnReflecties: TrainingslijnReflectie[];
  onToggleLijn: (naam: string) => void;
  onUpdateReflectie: (
    lijn: string,
    dagdeel: string,
    patch: Partial<Pick<TrainingslijnReflectie, "inzichten" | "leerpunten">>,
  ) => void;
}

export function TrainingslijnReflectieBlok({
  gevolgdeTrainingslijnen,
  trainingslijnReflecties,
  onToggleLijn,
  onUpdateReflectie,
}: TrainingslijnReflectieBlokProps) {
  const [lijnen, setLijnen] = useState<Trainingslijn[]>([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState("");

  useEffect(() => {
    let actief = true;
    fetchTrainingslijnen()
      .then((data) => {
        if (actief) setLijnen(data);
      })
      .catch((error) => {
        if (actief) {
          setFout(
            error instanceof Error
              ? error.message
              : "Kon de trainingslijnen niet laden",
          );
        }
      })
      .finally(() => {
        if (actief) setLaden(false);
      });
    return () => {
      actief = false;
    };
  }, []);

  const teKiezen = lijnen.filter(
    (l) => !gevolgdeTrainingslijnen.includes(l.naam),
  );

  return (
    <>
      <div className="sk">Trainingslijnen — reflectie</div>
      <div className="tip-box">
        Geef aan welke trainingslijn(en) je volgt. De dagdelen komen dan
        automatisch mee vanuit de trainingslijnen-navigator; reflecteer per
        dagdeel op wat je hebt opgestoken.
      </div>

      {laden && (
        <p style={{ fontSize: 12, color: "var(--grijs-licht)" }}>
          Trainingslijnen laden...
        </p>
      )}
      {fout && <p style={{ fontSize: 12, color: "var(--rood)" }}>{fout}</p>}

      {!laden && !fout && (
        <div className="form-rij" style={{ marginBottom: 12 }}>
          <select
            value=""
            disabled={teKiezen.length === 0}
            onChange={(e) => {
              if (e.target.value) onToggleLijn(e.target.value);
            }}
          >
            <option value="">
              {teKiezen.length === 0
                ? "— Alle lijnen al toegevoegd —"
                : "— Trainingslijn toevoegen —"}
            </option>
            {teKiezen.map((l) => (
              <option key={l.naam} value={l.naam}>
                {l.naam}
              </option>
            ))}
          </select>
        </div>
      )}

      {gevolgdeTrainingslijnen.map((naam) => {
        const lijn = lijnen.find((l) => l.naam === naam);

        return (
          <div key={naam} className="pop-pad">
            <div
              className="pop-pad-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h4>{naam}</h4>
              <button
                type="button"
                className="btn btn-t"
                onClick={() => onToggleLijn(naam)}
              >
                Verwijderen
              </button>
            </div>
            <div className="pop-pad-body open">
              {!laden && !lijn && (
                <p style={{ fontSize: 12, color: "var(--grijs-licht)" }}>
                  Kon de dagdelen voor deze lijn niet (meer) vinden in de
                  trainingslijnen-navigator. Je eerder ingevulde reflecties
                  blijven bewaard.
                </p>
              )}
              {lijn?.dagdelen.map((dagdeel) => {
                const reflectie = trainingslijnReflecties.find(
                  (r) => r.lijn === naam && r.dagdeel === dagdeel.label,
                );
                return (
                  <div
                    key={dagdeel.label}
                    style={{
                      border: "1px solid var(--grijs-lijn)",
                      borderRadius: 6,
                      padding: 12,
                      marginBottom: 10,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: "bold",
                        color: "var(--blauw)",
                        marginBottom: 8,
                      }}
                    >
                      {dagdeel.label}
                      {dagdeel.datum ? ` — ${dagdeel.datum}` : ""}
                    </p>
                    <FormField label="Welke inzichten heb je opgedaan?">
                      <textarea
                        rows={2}
                        value={reflectie?.inzichten ?? ""}
                        onChange={(e) =>
                          onUpdateReflectie(naam, dagdeel.label, {
                            inzichten: e.target.value,
                          })
                        }
                      />
                    </FormField>
                    <FormField label="Met welke twee leerpunten ga je vanaf morgen aan de slag?">
                      <textarea
                        rows={2}
                        value={reflectie?.leerpunten ?? ""}
                        onChange={(e) =>
                          onUpdateReflectie(naam, dagdeel.label, {
                            leerpunten: e.target.value,
                          })
                        }
                      />
                    </FormField>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
