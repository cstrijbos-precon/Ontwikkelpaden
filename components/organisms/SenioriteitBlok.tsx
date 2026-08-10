"use client";

import { useState } from "react";
import { FormField } from "@/components/molecules/FormField";
import { GidsUitlegModal } from "@/components/organisms/GidsUitlegModal";
import { effectieveNiveaus } from "@/lib/effectief-niveau";
import {
  bepaalSenioriteit,
  leesTProfiel,
  SENIORITEIT_LABEL,
} from "@/lib/senioriteit";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface SenioriteitBlokProps {
  state: OntwikkelpadenState;
  onUpdate: (waarde: string) => void;
}

export function SenioriteitBlok({ state, onUpdate }: SenioriteitBlokProps) {
  const [gidsOpen, setGidsOpen] = useState(false);

  const advies = bepaalSenioriteit(
    effectieveNiveaus(state),
    leesTProfiel(state),
  );
  const label = SENIORITEIT_LABEL[advies.suggestie];
  const isOvergenomen =
    state.niveauInschaling.trim().toLowerCase() === label.toLowerCase();

  const tProfielTekst = advies.tProfiel.diep
    ? advies.tProfiel.breed
      ? "diep én breed ingevuld"
      : "diep ingevuld"
    : advies.tProfiel.breed
      ? "breed ingevuld"
      : "nog niet ingevuld";

  return (
    <div className="senioriteit-blok">
      <div className="senioriteit-kop">
        <span className="sk" style={{ margin: 0 }}>
          Junior, medior of senior?
        </span>
        <button
          type="button"
          className="gids-link"
          onClick={() => setGidsOpen(true)}
        >
          📄 Uitleg uit de ontwikkelpadengids
        </button>
      </div>

      <div className="senioriteit-suggestie">
        <div className={`senioriteit-badge ${advies.suggestie}`}>{label}</div>
        <div className="senioriteit-tekst">
          <div className="senioriteit-reden">
            <strong>Suggestie op basis van het framework.</strong>{" "}
            {advies.reden}
          </div>
          {advies.volgendeStap && (
            <div className="senioriteit-stap">{advies.volgendeStap}</div>
          )}
          <div className="senioriteit-tprofiel">
            T-profiel: {tProfielTekst}. Dit telt niet mee in de berekening —
            weeg het in het gesprek.
          </div>
        </div>
      </div>

      <FormField label="Vastgestelde inschaling">
        <input
          value={state.niveauInschaling}
          placeholder="bijv. Medior"
          onChange={(e) => onUpdate(e.target.value)}
        />
      </FormField>
      {!isOvergenomen && (
        <button
          type="button"
          className="senioriteit-overnemen"
          onClick={() => onUpdate(label)}
        >
          Neem suggestie over: {label}
        </button>
      )}

      {gidsOpen && <GidsUitlegModal onClose={() => setGidsOpen(false)} />}
    </div>
  );
}
