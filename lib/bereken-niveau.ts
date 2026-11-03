import { padenVoor, type Variant, variantVan } from "@/lib/variant";
import type {
  CompId,
  OntwikkelpadenState,
  PadId,
} from "@/types/ontwikkelpaden";

export function berekenNiveau(
  padId: PadId,
  scores: Record<CompId, number>,
  variant: Variant = "standaard",
): number {
  const pad = padenVoor(variant)[padId];
  let niveau = 0;

  for (let i = 0; i < pad.vereisten.length; i++) {
    const vereist = pad.vereisten[i];
    if (!vereist) continue;

    const voldoet =
      scores.b >= vereist.b &&
      scores.k >= vereist.k &&
      scores.o >= vereist.o &&
      scores.org >= vereist.org &&
      (vereist.t === undefined || scores.t >= vereist.t);

    if (voldoet) niveau = i + 1;
  }

  return niveau;
}

export function berekenAlleNiveaus(
  state: OntwikkelpadenState,
): Record<PadId, number> {
  const variant = variantVan(state.wereld);
  return {
    vakexpert: berekenNiveau("vakexpert", state.scores, variant),
    adviseur: berekenNiveau("adviseur", state.scores, variant),
    leider: berekenNiveau("leider", state.scores, variant),
    trainer: berekenNiveau("trainer", state.scores, variant),
  };
}
