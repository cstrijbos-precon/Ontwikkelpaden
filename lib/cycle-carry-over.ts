import { berekenAlleNiveaus } from "@/lib/bereken-niveau";
import { createInitialState } from "@/lib/initial-state";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

/**
 * Bouwt de startstate voor een nieuw functioneringsgesprek op basis van een
 * afgerond gesprek. Sterren, T-profiel-framework en stamgegevens gaan mee;
 * alle overige tekstvelden en het akkoord starten leeg voor de nieuwe cyclus.
 */
export function buildNextCycleState(
  vorige: OntwikkelpadenState,
): OntwikkelpadenState {
  return {
    ...createInitialState(),
    naam: vorige.naam,
    bijPreconSinds: vorige.bijPreconSinds,
    niveauInschaling: vorige.niveauInschaling,
    datumVorig: vorige.datum,
    scores: { ...vorige.scores },
    tCellen: [...vorige.tCellen],
    vorigJaar: berekenAlleNiveaus(vorige),
  };
}
