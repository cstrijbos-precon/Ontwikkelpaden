import { DateInput } from "@/components/atoms/DateInput";
import { FormField } from "@/components/molecules/FormField";
import { ScoreBox } from "@/components/molecules/ScoreBox";
import { berekenNiveau } from "@/lib/bereken-niveau";
import { PAD_IDS, PADEN } from "@/lib/data/paden";
import { getPadColor } from "@/lib/pad-colors";
import type { GesprekStatus } from "@/types/gesprekken";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface ScreenAfrondingProps {
  state: OntwikkelpadenState;
  status: GesprekStatus;
  onUpdate: <K extends keyof OntwikkelpadenState>(
    key: K,
    value: OntwikkelpadenState[K],
  ) => void;
  onAfronden: () => void;
}

export function ScreenAfronding({
  state,
  status,
  onUpdate,
  onAfronden,
}: ScreenAfrondingProps) {
  const alleAkkoord =
    state.akkoordProfessional &&
    state.akkoordHoofdbeoordelaar &&
    state.akkoordMedebeoordelaar;

  return (
    <>
      <div className="scherm-titel">Afronding & ondertekening</div>
      <FormField label="Overige afspraken">
        <textarea
          rows={4}
          value={state.overigeAfspraken}
          onChange={(e) => onUpdate("overigeAfspraken", e.target.value)}
        />
      </FormField>
      <FormField label="Datum volgend functioneringsgesprek">
        <DateInput
          value={state.datumVolgend}
          onValueChange={(value) => onUpdate("datumVolgend", value)}
        />
      </FormField>
      <div className="sk">Samenvatting</div>
      <ScoreBox state={state} />
      <div className="score-box score-box-ambitie">
        <h4>Positie op de ontwikkelpaden</h4>
        {PAD_IDS.map((padId) => {
          const pad = PADEN[padId];
          const n = berekenNiveau(padId, state.scores);
          const amb = state.ambities[padId];
          const tg = state.trainingsgroepen[padId];

          return (
            <div key={padId} className="score-rij">
              <span style={{ color: getPadColor(padId), fontWeight: "bold" }}>
                {pad.label}
              </span>
              <span style={{ textAlign: "right" }}>
                {n > 0
                  ? `Niveau ${n} – ${pad.rollen[n - 1]}`
                  : "Niet ingeschaald"}
                {amb && n < 5
                  ? ` → Ambitie: niveau ${n + 1} – ${pad.rollen[n]}`
                  : ""}
                {tg && (
                  <>
                    <br />
                    <span
                      style={{ fontSize: "10.5px", color: "var(--oranje)" }}
                    >
                      Trainingsgroep: {tg}
                    </span>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <div className="afsluiting-box">
        <p
          style={{
            fontSize: 13,
            fontWeight: "bold",
            color: "var(--grijs)",
            marginBottom: 12,
          }}
        >
          Ondertekening voor akkoord
        </p>
        <div className="sign-grid">
          <label className="sign-box" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={state.akkoordProfessional}
              onChange={(e) =>
                onUpdate("akkoordProfessional", e.target.checked)
              }
            />{" "}
            Professional: {state.naam || "___________"} akkoord
          </label>
          <label className="sign-box" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={state.akkoordHoofdbeoordelaar}
              onChange={(e) =>
                onUpdate("akkoordHoofdbeoordelaar", e.target.checked)
              }
            />{" "}
            Hoofdbeoordelaar: {state.hoofdbeoordelaar || "___________"} akkoord
          </label>
          <label className="sign-box" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={state.akkoordMedebeoordelaar}
              onChange={(e) =>
                onUpdate("akkoordMedebeoordelaar", e.target.checked)
              }
            />{" "}
            Medebeoordelaar: {state.medebeoordelaar || "___________"} akkoord
          </label>
        </div>
        <button
          type="button"
          className="btn btn-v"
          style={{ marginTop: 16 }}
          disabled={!alleAkkoord || status === "completed"}
          onClick={onAfronden}
        >
          {status === "completed"
            ? "✓ Gesprek is afgerond"
            : "Gesprek afronden"}
        </button>
        {status === "completed" && (
          <p style={{ fontSize: 11, color: "var(--groen)", marginTop: 8 }}>
            Dit functioneringsgesprek is afgerond en vergrendeld. Verder werken
            kan nu op het POP-scherm.
          </p>
        )}
        <p
          style={{
            fontSize: 11,
            color: "var(--grijs-licht)",
            marginTop: 14,
            fontStyle: "italic",
          }}
        >
          Na ondertekening per mail doorsturen naar evankouwen@precongroup.com
        </p>
      </div>
    </>
  );
}
