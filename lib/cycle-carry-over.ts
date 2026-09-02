import { effectieveNiveaus } from "@/lib/effectief-niveau";
import { createInitialState } from "@/lib/initial-state";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

/**
 * Bouwt de startstate voor een nieuw functioneringsgesprek op basis van een
 * afgerond gesprek. Sterren, T-profiel-framework en stamgegevens gaan mee;
 * alle overige tekstvelden en het akkoord starten leeg voor de nieuwe cyclus.
 *
 * De beoordelaars gaan ook mee. Zonder dit begon elke nieuwe cyclus zonder
 * hoofd- en medebeoordelaar, en moest degene die vorig jaar al was
 * goedgekeurd zichzelf elk jaar opnieuw koppelen en opnieuw laten bevestigen.
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
    medebeoordelaar: vorige.medebeoordelaar,
  };
}
