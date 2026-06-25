import { PADEN } from "@/lib/data/paden";
import type { CompId, OntwikkelpadenState, PadId } from "@/types/ontwikkelpaden";

export function berekenNiveau(
  padId: PadId,
  scores: Record<CompId, number>,
): number {
  const pad = PADEN[padId];
  let niveau = 0;

  for (let i = 0; i < 5; i++) {
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
  return {
    vakexpert: berekenNiveau("vakexpert", state.scores),
    adviseur: berekenNiveau("adviseur", state.scores),
    leider: berekenNiveau("leider", state.scores),
    trainer: berekenNiveau("trainer", state.scores),
  };
}
