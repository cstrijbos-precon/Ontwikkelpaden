import { FormField } from "@/components/molecules/FormField";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface ScreenProfielProps {
  state: OntwikkelpadenState;
  onUpdate: <K extends keyof OntwikkelpadenState>(
    key: K,
    value: OntwikkelpadenState[K],
  ) => void;
}

export function ScreenProfiel({ state, onUpdate }: ScreenProfielProps) {
  return (
    <>
      <div className="scherm-titel">Jouw profiel</div>
      <div className="scherm-sub">
        Om in je kracht te komen, moet je eerst weten wat die kracht is
      </div>
      <div className="info-box">
        Schrijf op wat je zo te binnen schiet en spar hierover met je business
        manager. <strong>Hier is geen goed en fout!</strong>
      </div>
      <FormField label="Eigenschappen, krachten en drijfveren">
        <textarea
          rows={8}
          placeholder="Eigenschappen (introvert/extravert, grote lijnen/details, pragmatisch...)&#10;Waar ben je goed in?&#10;Wat vind je leuk?&#10;Drijfveren: waar doe jij het eigenlijk voor?"
          value={state.profiel}
          onChange={(e) => onUpdate("profiel", e.target.value)}
        />
      </FormField>
    </>
  );
}
