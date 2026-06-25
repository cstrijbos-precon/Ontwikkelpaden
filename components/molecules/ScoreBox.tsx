import { COMPS } from "@/lib/data/competenties";
import { sterDisplay } from "@/lib/star-display";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface ScoreBoxProps {
  state: OntwikkelpadenState;
  title?: string;
}

export function ScoreBox({ state, title = "Competentiescores" }: ScoreBoxProps) {
  return (
    <div className="score-box">
      <h4>{title}</h4>
      {COMPS.map((c) => {
        const score = state.scores[c.id];
        const stars = sterDisplay(score);
        return (
          <div key={c.id} className="score-rij">
            <span>{c.label}</span>
            <span className="sc-ster">
              {score > 0 ? (
                <>
                  {stars.filled}
                  <span style={{ opacity: 0.3 }}>{stars.empty}</span>
                </>
              ) : (
                <span style={{ color: "var(--grijs-licht)", fontSize: 12 }}>
                  Nog niet ingevuld
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
