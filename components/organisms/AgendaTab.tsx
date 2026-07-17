"use client";

import AgendaMonthCard from "@/components/molecules/AgendaMonthCard";
import type { VerbeterplanningActions } from "@/hooks/useVerbeterplanning";
import { AGENDA_MONTHS } from "@/lib/verbeterplanning/constants";
import type { AgendaEntry } from "@/lib/verbeterplanning/types";

interface AgendaTabProps {
  agenda: AgendaEntry[];
  actions: VerbeterplanningActions;
}

export default function AgendaTab({ agenda, actions }: AgendaTabProps) {
  return (
    <div className="agenda-wrap">
      <div className="agenda-intro">
        Plan per maand het MT-overleg — 18 maanden vooruit vanaf juni 2026.
      </div>
      <div className="agenda-grid">
        {AGENDA_MONTHS.map((monthLabel, monthIndex) => {
          const entry = agenda[monthIndex];
          if (!entry) return null;
          return (
            <AgendaMonthCard
              key={`${monthLabel.y}-${monthLabel.m}`}
              monthLabel={monthLabel}
              entry={entry}
              onChange={(field, value) =>
                actions.updateAgendaField(monthIndex, field, value)
              }
              onBlurField={(field, value) =>
                actions.flushAgendaField(monthIndex, field, value)
              }
            />
          );
        })}
      </div>
    </div>
  );
}
