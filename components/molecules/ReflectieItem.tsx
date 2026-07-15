import { DateInput } from "@/components/atoms/DateInput";
import type { Reflectie } from "@/types/ontwikkelpaden";

interface ReflectieItemProps {
  reflectie: Reflectie;
  onUpdate: (patch: Partial<Pick<Reflectie, "datum" | "tekst">>) => void;
  onRemove: () => void;
}

export function ReflectieItem({
  reflectie,
  onUpdate,
  onRemove,
}: ReflectieItemProps) {
  return (
    <div className="reflectie-item">
      <div className="reflectie-item-kop">
        <DateInput
          value={reflectie.datum}
          onValueChange={(datum) => onUpdate({ datum })}
        />
        <button type="button" className="btn btn-t" onClick={onRemove}>
          Verwijderen
        </button>
      </div>
      <textarea
        rows={3}
        placeholder="Waar wil je op reflecteren?"
        value={reflectie.tekst}
        onChange={(e) => onUpdate({ tekst: e.target.value })}
      />
    </div>
  );
}
