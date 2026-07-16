import { DateInput } from "@/components/atoms/DateInput";
import { FormField } from "@/components/molecules/FormField";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface ScreenGegevensProps {
  state: OntwikkelpadenState;
  importWarnings: string[];
  onUpdate: <K extends keyof OntwikkelpadenState>(
    key: K,
    value: OntwikkelpadenState[K],
  ) => void;
  onImportDocx: (file: File) => void;
  onDismissImportWarnings: () => void;
}

export function ScreenGegevens({
  state,
  importWarnings,
  onUpdate,
  onImportDocx,
  onDismissImportWarnings,
}: ScreenGegevensProps) {
  return (
    <>
      <div className="scherm-titel">Basisgegevens</div>
      <div className="scherm-sub">
        F-04 Functioneringsgesprek en POP · versie 02/04/2026
      </div>
      <div className="form-rij" style={{ alignItems: "center" }}>
        <label className="btn btn-t" style={{ display: "inline-block" }}>
          📄 Importeer oud gesprek (.docx)
          <input
            type="file"
            accept=".docx"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportDocx(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {importWarnings.length > 0 && (
        <div
          style={{
            background: "#fff8e6",
            border: "1px solid #e8c766",
            borderRadius: 5,
            padding: "10px 14px",
            margin: "12px 0",
            fontSize: 13,
          }}
        >
          <strong>Let op bij import:</strong>
          <ul style={{ margin: "6px 0 8px", paddingLeft: 20 }}>
            {importWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-t"
            onClick={onDismissImportWarnings}
          >
            Begrepen
          </button>
        </div>
      )}
      <div className="form-rij">
        <FormField label="Naam professional">
          <input
            value={state.naam}
            placeholder="Volledige naam..."
            onChange={(e) => onUpdate("naam", e.target.value)}
          />
        </FormField>
        <FormField label="Bij Précon sinds">
          <input
            value={state.bijPreconSinds}
            placeholder="bijv. januari 2022"
            onChange={(e) => onUpdate("bijPreconSinds", e.target.value)}
          />
        </FormField>
      </div>
      <div className="form-rij">
        <FormField label="Datum gesprek">
          <DateInput
            value={state.datum}
            onValueChange={(value) => onUpdate("datum", value)}
          />
        </FormField>
        <FormField label="Datum vorig gesprek">
          <DateInput
            value={state.datumVorig}
            onValueChange={(value) => onUpdate("datumVorig", value)}
          />
        </FormField>
      </div>
      <div className="form-rij">
        <FormField label="Hoofdbeoordelaar">
          <input
            value={state.hoofdbeoordelaar}
            placeholder="Naam..."
            onChange={(e) => onUpdate("hoofdbeoordelaar", e.target.value)}
          />
        </FormField>
        <FormField label="Medebeoordelaar">
          <input
            value={state.medebeoordelaar}
            placeholder="Naam (optioneel)..."
            onChange={(e) => onUpdate("medebeoordelaar", e.target.value)}
          />
        </FormField>
      </div>
    </>
  );
}
