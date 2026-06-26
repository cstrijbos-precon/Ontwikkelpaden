import { DateInput } from "@/components/atoms/DateInput";
import { FormField } from "@/components/molecules/FormField";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface ScreenGegevensProps {
  state: OntwikkelpadenState;
  onUpdate: <K extends keyof OntwikkelpadenState>(
    key: K,
    value: OntwikkelpadenState[K],
  ) => void;
}

export function ScreenGegevens({ state, onUpdate }: ScreenGegevensProps) {
  return (
    <>
      <div className="scherm-titel">Basisgegevens</div>
      <div className="scherm-sub">
        F-04 Functioneringsgesprek en POP · versie 02/04/2026
      </div>
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
