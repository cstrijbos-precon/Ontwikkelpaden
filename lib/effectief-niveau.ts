import { berekenNiveau } from "@/lib/bereken-niveau";
import { padenVoor, padIdsVoor, variantVan } from "@/lib/variant";
import type { OntwikkelpadenState, PadId } from "@/types/ontwikkelpaden";

/**
 * Het niveau dat telt op een pad: een handmatige correctie wint van de
 * berekening uit de competentiescores.
 */
export function effectiefNiveau(
  padId: PadId,
  state: OntwikkelpadenState,
): number {
  const variant = variantVan(state.wereld);
  // Een pad dat deze variant niet kent (Trainer bij Support) telt niet mee,
  // ook niet als er van een eerdere wereld nog een correctie in de state staat.
  if (!padIdsVoor(variant).includes(padId)) return 0;
  return (
    state.niveauCorrectie[padId] ?? berekenNiveau(padId, state.scores, variant)
  );
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
  const variant = variantVan(state.wereld);
  const paden = padenVoor(variant);

  for (const padId of padIdsVoor(variant)) {
    const gecorrigeerd = state.niveauCorrectie[padId];
    if (gecorrigeerd === null) continue;

    const berekend = berekenNiveau(padId, state.scores, variant);
    if (gecorrigeerd === berekend) continue;

    correcties.push({
      padId,
      padLabel: paden[padId].label,
      berekend,
      gecorrigeerd,
      rol: paden[padId].rollen[gecorrigeerd - 1] ?? "Niet ingeschaald",
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
