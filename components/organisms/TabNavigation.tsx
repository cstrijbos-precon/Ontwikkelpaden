import { SCHERMEN } from "@/lib/data/schermen";
import type { GesprekStatus } from "@/types/gesprekken";

interface TabNavigationProps {
  huidig: number;
  status: GesprekStatus;
  onSelect: (index: number) => void;
}

export function TabNavigation({
  huidig,
  status,
  onSelect,
}: TabNavigationProps) {
  const gesprekVergrendeld = status !== "draft";

  return (
    <>
      <div className="vp-bar">
        {SCHERMEN.map((_, i) => (
          <div
            key={SCHERMEN[i]?.id}
            className={`vp-stap ${i < huidig ? "gedaan" : ""} ${i === huidig ? "actief" : ""}`}
          />
        ))}
      </div>
      <div className="tabs-bar">
        {SCHERMEN.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`tab ${i === huidig ? "active" : ""}`}
            onClick={() => onSelect(i)}
          >
            {s.fase === "gesprek" && gesprekVergrendeld ? "🔒 " : ""}
            {s.label}
          </button>
        ))}
      </div>
    </>
  );
}
