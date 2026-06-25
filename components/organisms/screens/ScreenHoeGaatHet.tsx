import { FormField } from "@/components/molecules/FormField";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface ScreenHoeGaatHetProps {
  state: OntwikkelpadenState;
  onUpdate: <K extends keyof OntwikkelpadenState>(
    key: K,
    value: OntwikkelpadenState[K],
  ) => void;
}

export function ScreenHoeGaatHet({ state, onUpdate }: ScreenHoeGaatHetProps) {
  return (
    <>
      <div className="scherm-titel">Hoe gaat het?</div>
      <div className="scherm-sub">
        Een open gesprek over welzijn, werkdruk en kernwaarden
      </div>
      <FormField label="Hoe gaat het met je?">
        <textarea
          rows={4}
          placeholder="Vertel hoe het gaat..."
          value={state.hoeGaatHet}
          onChange={(e) => onUpdate("hoeGaatHet", e.target.value)}
        />
      </FormField>
      <FormField label="Werkdruk en ervaren belasting">
        <textarea
          rows={3}
          placeholder="Hoe ervaar je de werkdruk?"
          value={state.werkdruk}
          onChange={(e) => onUpdate("werkdruk", e.target.value)}
        />
      </FormField>
      <div className="sk">Kernwaarden: Praktisch · Betrokken · Vakkundig</div>
      <FormField label="Voorbeelden kernwaarden">
        <textarea
          rows={4}
          placeholder="Geef voorbeelden van Praktisch, Betrokken en/of Vakkundig handelen..."
          value={state.kernwaarden}
          onChange={(e) => onUpdate("kernwaarden", e.target.value)}
        />
      </FormField>
    </>
  );
}
