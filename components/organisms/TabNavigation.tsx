import { SCHERMEN } from "@/lib/data/schermen";

interface TabNavigationProps {
  huidig: number;
  onSelect: (index: number) => void;
}

export function TabNavigation({ huidig, onSelect }: TabNavigationProps) {
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
            {s.label}
          </button>
        ))}
      </div>
    </>
  );
}
