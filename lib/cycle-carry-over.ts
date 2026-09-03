import { effectieveNiveaus } from "@/lib/effectief-niveau";
import { createInitialState } from "@/lib/initial-state";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

/**
 * Bouwt de startstate voor een nieuw functioneringsgesprek op basis van een
 * afgerond gesprek. Sterren, T-profiel-framework en stamgegevens gaan mee;
 * alle overige tekstvelden en het akkoord starten leeg voor de nieuwe cyclus.
 *
 * De hoofdbeoordelaar gaat mee als naam op het formulier. De echte toegang
 * loopt sinds kort via een doorlopende koppeling (zie
 * lib/hoofdbeoordelaar-koppeling.ts) die los van dit gesprek blijft bestaan;
 * deze regel is dus alleen nog voor het gemak op het scherm, niet voor
 * toegang. Medebeoordelaar is bewust een relatie per gesprek — "alleen het
 * huidige verslag" — en begint dus leeg in elke nieuwe cyclus.
 */
export function buildNextCycleState(
  vorige: OntwikkelpadenState,
): OntwikkelpadenState {
  return {
    ...createInitialState(),
    naam: vorige.naam,
    wereld: vorige.wereld,
    bijPreconSinds: vorige.bijPreconSinds,
    niveauInschaling: vorige.niveauInschaling,
    datumVorig: vorige.datum,
    scores: { ...vorige.scores },
    tCellen: [...vorige.tCellen],
    vorigJaar: effectieveNiveaus(vorige),
    hoofdbeoordelaar: vorige.hoofdbeoordelaar,
  };
}
