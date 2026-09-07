import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import type {
  OntwikkelpadenState,
  TrainingslijnReflectie,
} from "@/types/ontwikkelpaden";

export function useTrainingslijnReflecties(
  setState: Dispatch<SetStateAction<OntwikkelpadenState>>,
) {
  /**
   * Een lijn toevoegen of verwijderen uit de lijst die iemand volgt. De
   * ingevulde reflecties blijven bewaard als een lijn eraf gaat — per ongeluk
   * uitvinken mag niemands getypte tekst kwijtraken; vinkt iemand de lijn
   * later weer aan, dan staat het er nog.
   */
  const toggleGevolgdeTrainingslijn = useCallback(
    (naam: string) => {
      setState((prev) => {
        const gevolgd = prev.gevolgdeTrainingslijnen.includes(naam)
          ? prev.gevolgdeTrainingslijnen.filter((n) => n !== naam)
          : [...prev.gevolgdeTrainingslijnen, naam];
        return { ...prev, gevolgdeTrainingslijnen: gevolgd };
      });
    },
    [setState],
  );

  /** Zoek-of-maak op (lijn, dagdeel) — er is geen apart id per dagdeel. */
  const updateTrainingslijnReflectie = useCallback(
    (
      lijn: string,
      dagdeel: string,
      patch: Partial<
        Pick<TrainingslijnReflectie, "opvolging" | "inzichten" | "leerpunten">
      >,
    ) => {
      setState((prev) => {
        const bestaat = prev.trainingslijnReflecties.some(
          (r) => r.lijn === lijn && r.dagdeel === dagdeel,
        );
        const trainingslijnReflecties = bestaat
          ? prev.trainingslijnReflecties.map((r) =>
              r.lijn === lijn && r.dagdeel === dagdeel ? { ...r, ...patch } : r,
            )
          : [
              ...prev.trainingslijnReflecties,
              {
                lijn,
                dagdeel,
                opvolging: "",
                inzichten: "",
                leerpunten: "",
                ...patch,
              },
            ];
        return { ...prev, trainingslijnReflecties };
      });
    },
    [setState],
  );

  return { toggleGevolgdeTrainingslijn, updateTrainingslijnReflectie };
}
