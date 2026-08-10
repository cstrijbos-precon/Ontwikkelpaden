import { berekenNiveau } from "@/lib/bereken-niveau";
import { PAD_IDS, PADEN } from "@/lib/data/paden";
import type { OntwikkelpadenState, PadId } from "@/types/ontwikkelpaden";

/**
 * Het niveau dat telt op een pad: een handmatige correctie wint van de
 * berekening uit de competentiescores.
 */
export function effectiefNiveau(
  padId: PadId,
  state: OntwikkelpadenState,
): number {
  return state.niveauCorrectie[padId] ?? berekenNiveau(padId, state.scores);
}

export function effectieveNiveaus(
  state: OntwikkelpadenState,
): Record<PadId, number> {
  return {
    vakexpert: effectiefNiveau("vakexpert", state),
    adviseur: effectiefNiveau("adviseur", state),
    leider: effectiefNiveau("leider", state),
    trainer: effectiefNiveau("trainer", state),
  };
}

export interface Correctie {
  padId: PadId;
  padLabel: string;
  berekend: number;
  gecorrigeerd: number;
  rol: string;
}

/** Alleen de paden waar het bolletje daadwerkelijk is verschoven. */
export function actieveCorrecties(state: OntwikkelpadenState): Correctie[] {
  const correcties: Correctie[] = [];

  for (const padId of PAD_IDS) {
    const gecorrigeerd = state.niveauCorrectie[padId];
    if (gecorrigeerd === null) continue;

    const berekend = berekenNiveau(padId, state.scores);
    if (gecorrigeerd === berekend) continue;

    correcties.push({
      padId,
      padLabel: PADEN[padId].label,
      berekend,
      gecorrigeerd,
      rol: PADEN[padId].rollen[gecorrigeerd - 1] ?? "Niet ingeschaald",
    });
  }

  return correcties;
}

/** Een verschoven bolletje zonder toelichting is niet af. */
export function toelichtingOntbreekt(state: OntwikkelpadenState): boolean {
  return (
    actieveCorrecties(state).length > 0 &&
    state.niveauCorrectieToelichting.trim() === ""
  );
}
