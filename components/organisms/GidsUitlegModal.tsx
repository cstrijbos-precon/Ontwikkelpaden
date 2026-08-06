"use client";

import { useEffect } from "react";
import {
  GIDS_TOEPASSING,
  SENIORITEIT_GIDS,
} from "@/lib/data/ontwikkelpadengids";

interface GidsUitlegModalProps {
  onClose: () => void;
}

export function GidsUitlegModal({ onClose }: GidsUitlegModalProps) {
  useEffect(() => {
    const sluitOpEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", sluitOpEscape);
    return () => window.removeEventListener("keydown", sluitOpEscape);
  }, [onClose]);

  return (
    <div className="modal-overlay">
      {/* Klik naast de popup sluit hem; Escape doet hetzelfde. */}
      <button
        type="button"
        className="modal-achtergrond"
        onClick={onClose}
        aria-label="Sluiten"
        tabIndex={-1}
      />
      <dialog open className="modal-box gids-box" aria-labelledby="gids-titel">
        <div className="gids-hdr">
          <h2 id="gids-titel">{SENIORITEIT_GIDS.titel}</h2>
          <button
            type="button"
            className="gids-sluit"
            onClick={onClose}
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>
        <p className="gids-intro">{SENIORITEIT_GIDS.intro}</p>

        {SENIORITEIT_GIDS.secties.map((sectie) => (
          <section key={sectie.kop} className="gids-sectie">
            <h3>{sectie.kop}</h3>
            {sectie.alineas?.map((alinea) => (
              <p key={alinea}>{alinea}</p>
            ))}
            {sectie.criteria && (
              <ul>
                {sectie.criteria.map((criterium) => (
                  <li key={criterium}>{criterium}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="gids-letop">
          <strong>Let op: </strong>
          {SENIORITEIT_GIDS.letOp}
        </div>

        <div className="gids-toepassing">
          <strong>Hoe deze tool rekent: </strong>
          {GIDS_TOEPASSING}
        </div>
      </dialog>
    </div>
  );
}
