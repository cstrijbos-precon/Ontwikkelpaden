import { PADEN } from "@/lib/data/paden";
import type { PadOverzicht, VennCategorie } from "@/lib/vlootschouw/types";

interface VennDiagramProps {
  paden: PadOverzicht[];
}

const CATEGORIE_LABEL: Record<Exclude<VennCategorie, "geen-data">, string> = {
  "key-players": "key players",
  wachtkamer: "'wachtkamer'",
  zorgenkindjes: "'zorgenkindjes'",
  "huidige-kern": "'huidige kern'",
  "tijdelijke-krachten": "'tijdelijke krachten'",
  "most-wanted": "'most wanted'",
  "toekomstig-talent": "'toekomstig talent'",
};

const REGIO_POSITIE: Record<
  Exclude<VennCategorie, "geen-data">,
  { x: number; y: number }
> = {
  "toekomstig-talent": { x: 150, y: 55 },
  wachtkamer: { x: 108, y: 108 },
  "most-wanted": { x: 192, y: 108 },
  "key-players": { x: 150, y: 128 },
  zorgenkindjes: { x: 65, y: 175 },
  "huidige-kern": { x: 150, y: 190 },
  "tijdelijke-krachten": { x: 235, y: 175 },
};

export function VennDiagram({ paden }: VennDiagramProps) {
  const perCategorie = new Map<
    Exclude<VennCategorie, "geen-data">,
    PadOverzicht[]
  >();
  const zonderData: PadOverzicht[] = [];

  for (const pad of paden) {
    if (pad.vennCategorie === "geen-data") {
      zonderData.push(pad);
      continue;
    }
    const lijst = perCategorie.get(pad.vennCategorie) ?? [];
    lijst.push(pad);
    perCategorie.set(pad.vennCategorie, lijst);
  }

  return (
    <div className="venn-wrap">
      <svg
        viewBox="0 0 300 260"
        className="venn-svg"
        aria-label="Vlootschouw Venn-diagram"
      >
        <circle cx="150" cy="95" r="90" className="venn-cirkel venn-straks" />
        <circle
          cx="110"
          cy="170"
          r="90"
          className="venn-cirkel venn-aanwezig"
        />
        <circle cx="190" cy="170" r="90" className="venn-cirkel venn-nodig" />
        <text x="150" y="30" className="venn-titel">
          Straks nodig
        </text>
        <text x="35" y="230" className="venn-titel">
          Nu aanwezig
        </text>
        <text x="265" y="230" className="venn-titel">
          Nu nodig
        </text>
        {Object.entries(REGIO_POSITIE).map(([categorie, pos]) => {
          const items =
            perCategorie.get(
              categorie as Exclude<VennCategorie, "geen-data">,
            ) ?? [];
          return (
            <text key={categorie} x={pos.x} y={pos.y} className="venn-inhoud">
              {items.length === 0 ? (
                <tspan className="venn-leeg">—</tspan>
              ) : (
                items.map((pad, i) => (
                  <tspan key={pad.padId} x={pos.x} dy={i === 0 ? 0 : 12}>
                    {PADEN[pad.padId].label} (
                    {pad.vervullingPercentage === null
                      ? "—"
                      : `${pad.vervullingPercentage}%`}
                    )
                  </tspan>
                ))
              )}
            </text>
          );
        })}
      </svg>
      <ul className="venn-legenda">
        {Object.entries(CATEGORIE_LABEL).map(([categorie, label]) => (
          <li key={categorie}>{label}</li>
        ))}
      </ul>
      {zonderData.length > 0 && (
        <p className="venn-geen-data">
          Nog geen gegevens voor:{" "}
          {zonderData.map((p) => PADEN[p.padId].label).join(", ")}.
        </p>
      )}
    </div>
  );
}
