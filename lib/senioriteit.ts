import type { OntwikkelpadenState, PadId } from "@/types/ontwikkelpaden";

export type Senioriteit = "junior" | "medior" | "senior";

export interface TProfielSignaal {
  diep: boolean;
  breed: boolean;
}

export interface SenioriteitAdvies {
  /** Suggestie op basis van de vier ontwikkelpaden. Nooit bindend. */
  suggestie: Senioriteit;
  /** Welk criterium uit de gids de suggestie draagt. */
  reden: string;
  /** Wat er nog nodig is voor de volgende stap; null bij senior. */
  volgendeStap: string | null;
  tProfiel: TProfielSignaal;
}

export const SENIORITEIT_LABEL: Record<Senioriteit, string> = {
  junior: "Junior",
  medior: "Medior",
  senior: "Senior",
};

/**
 * Criteria uit de ontwikkelpadengids, toegepast op alle vier de paden.
 * De gids schrijft "op de twee anderen" / "op de andere" — met vier paden
 * lezen we dat als: alle overige paden.
 *
 * Het T-profiel telt hier bewust niet mee. In de gids staat dat criterium
 * woordelijk hetzelfde onder medior en senior, waardoor het letterlijk
 * toepassen iedereen met een T-profiel meteen senior zou maken. Het wordt
 * los getoond, zodat het in het gesprek gewogen wordt.
 */
export function bepaalSenioriteit(
  niveaus: Record<PadId, number>,
  tProfiel: TProfielSignaal,
): SenioriteitAdvies {
  // Aflopend gesorteerd: [hoogste, tweede, derde, vierde]
  const [n1 = 0, n2 = 0, n3 = 0, n4 = 0] = Object.values(niveaus).sort(
    (a, b) => b - a,
  );

  const aantalMinstens = (drempel: number) =>
    [n1, n2, n3, n4].filter((n) => n >= drempel).length;

  if (aantalMinstens(3) >= 2) {
    return {
      suggestie: "senior",
      reden: "Op 2 ontwikkelpaden niveau 3 bereikt.",
      volgendeStap: null,
      tProfiel,
    };
  }

  // Het tweede seniorcriterium uit de gids staat hier volledigheidshalve, maar
  // is in de praktijk onbereikbaar: "1 pad op niveau 4 en 1 ander op minimaal
  // 3" betekent al twee paden op niveau 3, waardoor het criterium hierboven
  // altijd eerder aanslaat. Het blijft staan zodat de code één op één naast de
  // gids te leggen is, en zodat het meteen werkt als criterium 1 ooit wijzigt.
  if (n1 >= 4 && n2 >= 3 && n3 >= 2 && n4 >= 2) {
    return {
      suggestie: "senior",
      reden:
        "Op 1 ontwikkelpad niveau 4 bereikt, op 1 ander minimaal niveau 3 en op de overige minimaal niveau 2.",
      volgendeStap: null,
      tProfiel,
    };
  }

  if (aantalMinstens(2) >= 2) {
    return {
      suggestie: "medior",
      reden: "Op 2 van de ontwikkelpaden niveau 2 bereikt.",
      volgendeStap: "Voor senior: op 2 ontwikkelpaden niveau 3 bereiken.",
      tProfiel,
    };
  }

  if (n1 >= 3 && n2 >= 1 && n3 >= 1 && n4 >= 1) {
    return {
      suggestie: "medior",
      reden:
        "Op 1 van de ontwikkelpaden niveau 3 bereikt en op de overige minimaal niveau 1.",
      volgendeStap: "Voor senior: op 2 ontwikkelpaden niveau 3 bereiken.",
      tProfiel,
    };
  }

  return {
    suggestie: "junior",
    reden: "Nog niet aan een van de medior-criteria uit de gids voldaan.",
    volgendeStap:
      "Voor medior: op 2 ontwikkelpaden niveau 2 bereiken, of op 1 pad niveau 3 met minimaal niveau 1 op de overige.",
    tProfiel,
  };
}

export function leesTProfiel(state: OntwikkelpadenState): TProfielSignaal {
  return {
    diep: state.tDiepte.trim() !== "",
    breed: state.tBreedte.trim() !== "",
  };
}
