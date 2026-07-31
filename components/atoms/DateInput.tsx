import type { InputHTMLAttributes } from "react";
import { useEffect, useState } from "react";
import { enforceDate } from "@/lib/field-format";

interface DateInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "value"
  > {
  value: string;
  onValueChange: (value: string) => void;
}

/**
 * Native date-inputs geven tijdens het typen een lege waarde terug zolang niet
 * alle segmenten (dag/maand/jaar) compleet zijn. Als die lege waarde meteen
 * wordt teruggekoppeld als controlled `value`, reset de browser de nog niet
 * aangeraakte segmenten — het veld lijkt dan "leeg te blijven vallen" tijdens
 * het typen. Daarom houden we een lokale draft aan en committeren we alleen
 * bij een complete waarde of bij het verlaten van het veld (blur).
 */
export function DateInput({
  value,
  onValueChange,
  className = "",
  ...props
}: DateInputProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <input
      type="date"
      value={draft}
      className={className}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw) {
          setDraft(raw);
          onValueChange(enforceDate(raw));
        }
      }}
      onBlur={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        onValueChange(enforceDate(raw));
      }}
      {...props}
    />
  );
}
