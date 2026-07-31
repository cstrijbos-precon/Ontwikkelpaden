import { PAD_IDS, PADEN } from "@/lib/data/paden";
import type { Wereld } from "@/lib/data/werelden";
import type { RolRij } from "@/lib/vlootschouw/types";
import type { PadId } from "@/types/ontwikkelpaden";

const NIVEAUS = [5, 4, 3, 2, 1] as const;
const MIN_BOL = 16;
const MAX_BOL = 64;

interface VlootschouwFrameworkGridProps {
  rollen: RolRij[];
  wereldFilter: Wereld | "totaal";
  /**
   * "aanwezig" = alleen live uit de gesprekken (oranje).
   * "nodigNu" = alleen het norm-cijfer (grijs).
   * "beide" = grijze bol (nodig) met de oranje bol (aanwezig) erbovenop —
   * zichtbaar grijs randje = nog niet vervuld, oranje dekt grijs volledig af
   * bij een overschot.
   */
  metric: "aanwezig" | "nodigNu" | "beide";
}

/**
 * Hergebruikt de .paden-grid/.niv-col/.niv-lbl/.pad-col/.pad-kop/.niv-cel-
 * opmaak van PadenGrid.tsx (de individuele FG-weergave), maar toont per cel
 * een bol waarvan de GROOTTE het aantal weergeeft in plaats van iemands eigen
 * positie — zodat alle vier de paden strak onder elkaar uitgelijnd blijven,
 * ongeacht de bol-grootte.
 */
export function VlootschouwFrameworkGrid({
  rollen,
  wereldFilter,
  metric,
}: VlootschouwFrameworkGridProps) {
  function somVoor(
    padId: PadId,
    niveau: number,
    veld: "aanwezig" | "nodigNu",
  ): number {
    return rollen
      .filter(
        (r) =>
          r.padId === padId &&
          r.niveau === niveau &&
          (wereldFilter === "totaal" || r.wereld === wereldFilter),
      )
      .reduce((sum, r) => sum + r[veld], 0);
  }

  const alleCellen = PAD_IDS.flatMap((padId) =>
    NIVEAUS.map((niveau) => ({ padId, niveau })),
  );
  const alleWaarden = alleCellen.flatMap(({ padId, niveau }) =>
    metric === "beide"
      ? [somVoor(padId, niveau, "aanwezig"), somVoor(padId, niveau, "nodigNu")]
      : [somVoor(padId, niveau, metric)],
  );
  const maxWaarde = Math.max(0, ...alleWaarden);

  function bolGrootte(waarde: number): number {
    if (waarde <= 0 || maxWaarde <= 0) return 0;
    return MIN_BOL + (waarde / maxWaarde) * (MAX_BOL - MIN_BOL);
  }

  return (
    <div className="paden-grid">
      <div className="niv-col">
        {NIVEAUS.map((n) => (
          <div key={n} className="niv-lbl">
            {n}
          </div>
        ))}
      </div>
      {PAD_IDS.map((padId) => {
        const pad = PADEN[padId];
        return (
          <div key={padId} className="pad-col">
            <div className={`pad-kop ${pad.kleur}`}>{pad.label}</div>
            {NIVEAUS.map((niveau) => {
              const rol = pad.rollen[niveau - 1] ?? "";
              const aanwezig = somVoor(padId, niveau, "aanwezig");
              const nodigNu = somVoor(padId, niveau, "nodigNu");

              return (
                <div key={niveau} className="niv-cel">
                  <div className="vloot-niv-inner">
                    <div className="vloot-bol-stack">
                      {(metric === "nodigNu" || metric === "beide") && (
                        <div
                          className="vloot-bol vloot-bol-grijs"
                          style={{
                            width: bolGrootte(nodigNu),
                            height: bolGrootte(nodigNu),
                          }}
                        >
                          {metric === "nodigNu" && nodigNu > 0 && (
                            <span>{nodigNu}</span>
                          )}
                        </div>
                      )}
                      {(metric === "aanwezig" || metric === "beide") && (
                        <div
                          className="vloot-bol vloot-bol-oranje"
                          style={{
                            width: bolGrootte(aanwezig),
                            height: bolGrootte(aanwezig),
                          }}
                        >
                          {metric === "aanwezig" && aanwezig > 0 && (
                            <span>{aanwezig}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {metric === "beide" && (aanwezig > 0 || nodigNu > 0) && (
                      <span className="vloot-cijfers">
                        {aanwezig}/{nodigNu}
                      </span>
                    )}
                    <span className="vloot-rol-naam">{rol}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
