/**
 * Tekst uit de ontwikkelpadengids, hoofdstuk "Junior, medior, senior".
 * Eén bron voor de uitleg die in het gesprek getoond wordt.
 */

export interface GidsSectie {
  kop: string;
  alineas?: string[];
  criteria?: string[];
}

export const SENIORITEIT_GIDS: {
  titel: string;
  intro: string;
  secties: GidsSectie[];
  letOp: string;
} = {
  titel: "Junior, medior, senior",
  intro:
    "De groei van junior, naar medior, naar senior hangt samen met jouw profiel.",
  secties: [
    {
      kop: "Senioriteit als professional",
      alineas: [
        "Elke starter komt binnen als junior en kan doorgroeien tot medior. Kom je binnen bij Précon met werkervaring, ga je na je eerste maand samen met je business manager kijken hoe jouw profiel er uit ziet.",
      ],
    },
    {
      kop: "Medior",
      alineas: [
        "We beschouwen een professional als medior zodra die aan een van de volgende criteria voldoet:",
      ],
      criteria: [
        "Op 2 van de ontwikkelpaden niveau 2 bereikt",
        "Op 1 van de ontwikkelpaden niveau 3 bereikt en op de twee anderen minimaal niveau 1 bereikt",
        "Inhoudelijk T-profiel diep (inhoudelijk expert op een onderwerp) of breed (op meerdere gebieden inzetbaar)",
      ],
    },
    {
      kop: "Senior",
      alineas: [
        "We beschouwen een professional als senior zodra die aan een van de volgende criteria voldoet:",
      ],
      criteria: [
        "Op 2 ontwikkelpaden niveau 3 bereikt",
        "Op 1 ontwikkelpad niveau 4 bereikt, op 1 andere minimaal niveau 3 en op de andere minimaal niveau 2",
        "Inhoudelijk T-profiel diep (inhoudelijk expert op een onderwerp) of breed (op meerdere gebieden inzetbaar)",
      ],
    },
  ],
  letOp:
    "Je senioriteit als professional is niet altijd direct te linken aan hoe je wordt voorgesteld voor een specifieke klantopdracht. Hoe je als consultant wordt voorgesteld bij een klantopdracht, is namelijk geheel afhankelijk van het type opdracht, jouw ervaring op dit gebied/onderwerp, in hoeverre jouw ervaring aansluit bij de benodigde competenties op deze opdracht, etc. Het kan dus zo zijn dat je bij de ene opdracht wordt voorgesteld als senior (door je diepe T-profiel en ervaring in dit vakgebied), terwijl je op een andere opdracht (bijvoorbeeld in een andere wereld) wordt voorgesteld als junior.",
};

/**
 * De app rekent met vier ontwikkelpaden, de gidstekst met drie. Dat verschil
 * hoort zichtbaar te zijn voor wie de suggestie naast de gids legt.
 */
export const GIDS_TOEPASSING =
  'In deze tool tellen alle vier de ontwikkelpaden mee: waar de gids spreekt over "de twee anderen" of "de andere", lezen we alle overige paden. Het T-profiel telt niet mee in de berekening — dat staat er los bij als aandachtspunt voor het gesprek.';
