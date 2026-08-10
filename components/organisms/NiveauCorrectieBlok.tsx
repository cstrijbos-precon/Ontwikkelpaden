"use client";

import { PADEN } from "@/lib/data/paden";
import {
  actieveCorrecties,
  toelichtingOntbreekt,
} from "@/lib/effectief-niveau";
import { getPadColor } from "@/lib/pad-colors";
import type { OntwikkelpadenState, PadId } from "@/types/ontwikkelpaden";

interface NiveauCorrectieBlokProps {
  state: OntwikkelpadenState;
  onHerstel: (padId: PadId) => void;
  onToelichting: (waarde: string) => void;
}

export function NiveauCorrectieBlok({
  state,
  onHerstel,
  onToelichting,
}: NiveauCorrectieBlokProps) {
  const correcties = actieveCorrecties(state);
  if (correcties.length === 0) return null;

  const ontbreekt = toelichtingOntbreekt(state);

  return (
    <div className={`correctie-blok${ontbreekt ? " onaf" : ""}`}>
      <div className="correctie-kop">
        Handmatig aangepaste inschaling ({correcties.length})
      </div>
      <ul className="correctie-lijst">
        {correcties.map((c) => {
          const pad = PADEN[c.padId];
          return (
            <li key={c.padId}>
              <span
                className="correctie-pad"
                style={{ color: getPadColor(c.padId) }}
              >
                {c.padLabel}
              </span>
              <span className="correctie-verschil">
                berekend niveau{" "}
                {c.berekend > 0 ? c.berekend : "— (niet ingeschaald)"} →{" "}
                <strong>
                  niveau {c.gecorrigeerd} – {pad.rollen[c.gecorrigeerd - 1]}
                </strong>
              </span>
              <button
                type="button"
                className="correctie-herstel"
                onClick={() => onHerstel(c.padId)}
              >
                Herstel berekening
              </button>
            </li>
          );
        })}
      </ul>
      <label className="correctie-label" htmlFor="correctie-toelichting">
        Toelichting op de aanpassing{" "}
        <span className="correctie-verplicht">verplicht</span>
      </label>
      <textarea
        id="correctie-toelichting"
        rows={3}
        placeholder="Waarom wijkt de inschaling af van de berekening? Bijv. ervaring die niet uit de competentiescores blijkt."
        value={state.niveauCorrectieToelichting}
        onChange={(e) => onToelichting(e.target.value)}
      />
      {ontbreekt && (
        <div className="correctie-waarschuwing">
          Vul een toelichting in — een verschoven bolletje zonder uitleg is niet
          te herleiden in een volgend gesprek.
        </div>
      )}
    </div>
  );
}
