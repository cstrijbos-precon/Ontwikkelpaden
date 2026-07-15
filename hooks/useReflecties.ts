import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import type { OntwikkelpadenState, Reflectie } from "@/types/ontwikkelpaden";

function nieuwReflectieId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `reflectie-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function vandaag(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useReflecties(
  setState: Dispatch<SetStateAction<OntwikkelpadenState>>,
) {
  const addReflectie = useCallback(() => {
    setState((prev) => ({
      ...prev,
      reflecties: [
        ...prev.reflecties,
        { id: nieuwReflectieId(), datum: vandaag(), tekst: "" } as Reflectie,
      ],
    }));
  }, [setState]);

  const updateReflectie = useCallback(
    (id: string, patch: Partial<Pick<Reflectie, "datum" | "tekst">>) => {
      setState((prev) => ({
        ...prev,
        reflecties: prev.reflecties.map((r) =>
          r.id === id ? { ...r, ...patch } : r,
        ),
      }));
    },
    [setState],
  );

  const removeReflectie = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        reflecties: prev.reflecties.filter((r) => r.id !== id),
      }));
    },
    [setState],
  );

  return { addReflectie, updateReflectie, removeReflectie };
}
