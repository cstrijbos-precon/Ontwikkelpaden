import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface TProfielGridProps {
  state: OntwikkelpadenState;
  onToggle: (r: number, k: number) => void;
}

export function TProfielGrid({ state, onToggle }: TProfielGridProps) {
  return (
    <div className="t-grid">
      {Array.from({ length: 6 }, (_, r) =>
        Array.from({ length: 10 }, (_, k) => {
          const key = `${r}-${k}`;
          const aan = state.tCellen.includes(key);
          return (
            <div
              key={key}
              className={`t-cel ${aan ? "aan" : ""}`}
              onClick={() => onToggle(r, k)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onToggle(r, k);
              }}
              role="button"
              tabIndex={0}
              aria-pressed={aan}
            />
          );
        }),
      )}
    </div>
  );
}
