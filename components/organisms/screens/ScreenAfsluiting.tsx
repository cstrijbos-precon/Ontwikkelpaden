import { DateInput } from "@/components/atoms/DateInput";
import { FormField } from "@/components/molecules/FormField";
import { ScoreBox } from "@/components/molecules/ScoreBox";
import { berekenNiveau } from "@/lib/bereken-niveau";
import { PAD_IDS, PADEN } from "@/lib/data/paden";
import { getPadColor } from "@/lib/pad-colors";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface ScreenAfsluitingProps {
  state: OntwikkelpadenState;
  onUpdate: <K extends keyof OntwikkelpadenState>(
    key: K,
    value: OntwikkelpadenState[K],
  ) => void;
}

export function ScreenAfsluiting({ state, onUpdate }: ScreenAfsluitingProps) {
  return (
    <>
      <div className="scherm-titel">Afsluiting & afspraken</div>
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
          <div className="sign-box">
            Professional: {state.naam || "___________"}
          </div>
          <div className="sign-box">
            Hoofdbeoordelaar: {state.hoofdbeoordelaar || "___________"}
          </div>
          <div className="sign-box">
            Medebeoordelaar: {state.medebeoordelaar || "___________"}
          </div>
        </div>
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
