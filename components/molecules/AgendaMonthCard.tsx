import type { MonthLabel } from "@/lib/verbeterplanning/constants";
import type { AgendaEntry } from "@/lib/verbeterplanning/types";

interface AgendaMonthCardProps {
  monthLabel: MonthLabel;
  entry: AgendaEntry;
  onChange: (
    field: "datum" | "projecten" | "opmerkingen",
    value: string,
  ) => void;
  onBlurField: (
    field: "datum" | "projecten" | "opmerkingen",
    value: string,
  ) => void;
}

export default function AgendaMonthCard({
  monthLabel,
  entry,
  onChange,
  onBlurField,
}: AgendaMonthCardProps) {
  return (
    <div className="agenda-month">
      <div className="agenda-month-header">
        <span>{monthLabel.m}</span>
        <span className="ym-year">{monthLabel.y}</span>
      </div>
      <div className="agenda-month-body">
        <div>
          <span className="agenda-field-label">Datum overleg</span>
          <input
            className="agenda-input"
            value={entry.datum}
            onChange={(e) => onChange("datum", e.target.value)}
            onBlur={(e) => onBlurField("datum", e.target.value)}
          />
        </div>
        <div>
          <span className="agenda-field-label">Welke projecten agenderen</span>
          <textarea
            className="agenda-input"
            value={entry.projecten}
            onChange={(e) => onChange("projecten", e.target.value)}
            onBlur={(e) => onBlurField("projecten", e.target.value)}
          />
        </div>
        <div>
          <span className="agenda-field-label">Overige opmerkingen</span>
          <textarea
            className="agenda-input small"
            value={entry.opmerkingen}
            onChange={(e) => onChange("opmerkingen", e.target.value)}
            onBlur={(e) => onBlurField("opmerkingen", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
