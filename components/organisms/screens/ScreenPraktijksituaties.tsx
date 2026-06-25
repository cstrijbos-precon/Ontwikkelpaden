import { FormField } from "@/components/molecules/FormField";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface ScreenPraktijksituatiesProps {
  state: OntwikkelpadenState;
  onUpdate: <K extends keyof OntwikkelpadenState>(
    key: K,
    value: OntwikkelpadenState[K],
  ) => void;
  onUpdateSituatie: (index: number, value: string) => void;
}

export function ScreenPraktijksituaties({
  state,
  onUpdate,
  onUpdateSituatie,
}: ScreenPraktijksituatiesProps) {
  return (
    <>
      <div className="scherm-titel">Praktijksituaties</div>
      <div className="scherm-sub">
        Bespreek minimaal 2 situaties die je afgelopen jaar hebt meegemaakt
      </div>
      <div className="info-box">
        Wat is het behaalde resultaat en wat heb je hieruit geleerd? Wat zegt
        dat over je competenties en T-profiel?
      </div>
      {[0, 1, 2].map((i) => (
        <FormField
          key={i}
          label={`Situatie ${i + 1}${i === 2 ? " (optioneel)" : ""}`}
        >
          <textarea
            rows={4}
            placeholder="Beschrijf de situatie, het resultaat en wat je hebt geleerd..."
            value={state.situaties[i] ?? ""}
            onChange={(e) => onUpdateSituatie(i, e.target.value)}
          />
        </FormField>
      ))}
      <div className="sk">Resultaten en overig</div>
      <FormField label="Overige resultaten en impactverbetering">
        <textarea
          rows={3}
          placeholder="Welk effect had het project? Bijdrage aan impactverbetering bij de klant?"
          value={state.impact}
          onChange={(e) => onUpdate("impact", e.target.value)}
        />
      </FormField>
      <FormField label="Declarabiliteit gepland en gerealiseerd">
        <textarea
          rows={2}
          value={state.declarabiliteit}
          onChange={(e) => onUpdate("declarabiliteit", e.target.value)}
        />
      </FormField>
      <FormField label="Overige afspraken uit vorig gesprek">
        <textarea
          rows={2}
          value={state.afspraken}
          onChange={(e) => onUpdate("afspraken", e.target.value)}
        />
      </FormField>
      <FormField label="Overige checks (inwerkschema, CV, portfolio)">
        <textarea
          rows={2}
          value={state.checks}
          onChange={(e) => onUpdate("checks", e.target.value)}
        />
      </FormField>
    </>
  );
}
