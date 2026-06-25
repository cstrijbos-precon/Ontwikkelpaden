import type { PadId } from "@/types/ontwikkelpaden";

const PAD_COLORS: Record<PadId, string> = {
  vakexpert: "var(--pad-vakexpert)",
  adviseur: "var(--pad-adviseur)",
  leider: "var(--pad-leider)",
  trainer: "var(--pad-trainer)",
};

export function getPadColor(padId: PadId): string {
  return PAD_COLORS[padId];
}
