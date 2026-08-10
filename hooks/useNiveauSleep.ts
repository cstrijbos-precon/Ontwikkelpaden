"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PadId } from "@/types/ontwikkelpaden";

/** Van boven naar beneden, zoals de kolom in beeld staat. */
const NIVEAUS_VAN_BOVEN = [5, 4, 3, 2, 1];

interface Sleep {
  padId: PadId;
  niveau: number;
}

/**
 * Laat het bolletje verticaal slepen langs een pad-kolom. Het bolletje landt
 * altijd exact op een niveau — nooit ertussen — doordat de positie van de
 * muis wordt teruggerekend naar het dichtstbijzijnde vak.
 */
export function useNiveauSleep(
  onZetNiveau: (padId: PadId, niveau: number) => void,
) {
  const [sleep, setSleep] = useState<Sleep | null>(null);
  const banen = useRef(new Map<PadId, HTMLElement>());
  const sleepRef = useRef<Sleep | null>(null);

  const registreerBaan = useCallback(
    (padId: PadId) => (el: HTMLDivElement | null) => {
      if (el) banen.current.set(padId, el);
      else banen.current.delete(padId);
    },
    [],
  );

  const niveauUitPositie = useCallback(
    (padId: PadId, clientY: number): number | null => {
      const baan = banen.current.get(padId);
      if (!baan) return null;

      const rect = baan.getBoundingClientRect();
      if (rect.height === 0) return null;

      const verhouding = (clientY - rect.top) / rect.height;
      const index = Math.floor(verhouding * NIVEAUS_VAN_BOVEN.length);
      const begrensd = Math.min(
        NIVEAUS_VAN_BOVEN.length - 1,
        Math.max(0, index),
      );
      return NIVEAUS_VAN_BOVEN[begrensd] ?? null;
    },
    [],
  );

  const startSleep = useCallback(
    (padId: PadId, huidigNiveau: number) => (e: React.PointerEvent) => {
      e.preventDefault();
      const start = { padId, niveau: huidigNiveau };
      sleepRef.current = start;
      setSleep(start);
    },
    [],
  );

  useEffect(() => {
    if (!sleep) return;

    const beweeg = (e: PointerEvent) => {
      const actief = sleepRef.current;
      if (!actief) return;
      const niveau = niveauUitPositie(actief.padId, e.clientY);
      if (niveau === null || niveau === actief.niveau) return;
      const volgende = { padId: actief.padId, niveau };
      sleepRef.current = volgende;
      setSleep(volgende);
    };

    const laatLos = () => {
      const actief = sleepRef.current;
      sleepRef.current = null;
      setSleep(null);
      if (actief) onZetNiveau(actief.padId, actief.niveau);
    };

    const annuleer = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      sleepRef.current = null;
      setSleep(null);
    };

    window.addEventListener("pointermove", beweeg);
    window.addEventListener("pointerup", laatLos);
    window.addEventListener("pointercancel", laatLos);
    window.addEventListener("keydown", annuleer);
    return () => {
      window.removeEventListener("pointermove", beweeg);
      window.removeEventListener("pointerup", laatLos);
      window.removeEventListener("pointercancel", laatLos);
      window.removeEventListener("keydown", annuleer);
    };
  }, [sleep, niveauUitPositie, onZetNiveau]);

  return {
    /** Niet-null tijdens het slepen: waar het bolletje nu zou landen. */
    sleep,
    registreerBaan,
    startSleep,
  };
}
