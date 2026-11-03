import { PADEN } from "@/lib/data/paden";
import type { Pad, PadId } from "@/types/ontwikkelpaden";

/**
 * De paden uit de Précon Ontwikkelpadengids Support (A-06-2). Support kent
 * drie paden in plaats van vier. Het pad "Support professional" neemt de
 * technische plek in van Adviseur (zelfde sleutel `adviseur`, zodat database
 * en opgeslagen gesprekken niet hoeven te veranderen); Trainer bestaat niet.
 *
 * Alleen sterren en toolboxen staan hier; de teksten bij de sterren zelf
 * (competenties.ts) zijn nog die van de standaardgids.
 */
export const PADEN_SUPPORT: Record<PadId, Pad> = {
  vakexpert: {
    label: "Vakexpert",
    kleur: "vakexpert",
    rollen: ["Support medewerker", "Deskundige", "Vakdeskundige"],
    vereisten: [
      { b: 0, k: 1, o: 1, org: 1 },
      { b: 1, k: 1, o: 2, org: 1 },
      { b: 2, k: 2, o: 2, org: 1 },
    ],
    toolboxen: {
      1: {
        vereist: ["Kerncompetenties behalen", "Inwerkprogramma goed afronden"],
        zelfDoen: [
          "Inhoudelijk werk doen: ga van start en leer van je collega's, durf vragen te stellen",
          "Ontwikkeldagen actief bijwonen",
        ],
        systemen: ["Elzi", "AFAS basis"],
        collega: [],
        trainingen: [
          "Starten met de inhoudelijke e-learnings en trainingen van Précon",
        ],
      },
      2: {
        vereist: ["Kerncompetenties behalen", "Verdieping T-profiel"],
        zelfDoen: [
          "Inhoudelijk werk uitvoeren en ervaring opdoen",
          "Kijken welke invloed jouw werk heeft op de andere interne processen",
        ],
        systemen: ["Elzi", "AFAS basis"],
        collega: ["Feedback vragen van collega's over je inhoudelijke werk"],
        trainingen: ["Training over inhoudelijk onderwerp volgen"],
      },
      3: {
        vereist: ["Kerncompetenties behalen", "Verdieping T-profiel"],
        zelfDoen: [
          "Inhoudelijk werk uitvoeren en ervaring opdoen, kritisch zijn op de methodieken en daar vragen over stellen",
          "Verbeteringen voorstellen en doorvoeren op de interne processen",
        ],
        systemen: ["Elzi", "AFAS"],
        collega: [
          "Feedback vragen van collega's over je inhoudelijke werk",
          "Sparren met collega's over ontwikkelingen",
          "Meekijken met collega's van Support die een rol spelen in een deel van jouw werk",
        ],
        trainingen: ["Training over inhoudelijk onderwerp volgen"],
      },
    },
  },
  adviseur: {
    label: "Support professional",
    kleur: "adviseur",
    rollen: [
      "Support medewerker",
      "Support specialist",
      "Support allrounder",
      "Support topper",
    ],
    vereisten: [
      { b: 0, k: 1, o: 1, org: 1 },
      { b: 1, k: 2, o: 1, org: 2 },
      { b: 2, k: 2, o: 2, org: 3 },
      { b: 3, k: 3, o: 2, org: 3 },
    ],
    toolboxen: {
      1: {
        vereist: ["Kerncompetenties behalen", "Inwerkprogramma goed afronden"],
        zelfDoen: [
          "Inhoudelijk werk doen: ga van start en leer van je collega's, durf vragen te stellen",
        ],
        systemen: ["Elzi", "AFAS basis"],
        collega: ["Meelopen met collega's in de inwerkperiode"],
        trainingen: [
          "Starten met de inhoudelijke e-learnings en trainingen van Précon",
        ],
      },
      2: {
        vereist: ["Kerncompetenties behalen", "Verbreding T-profiel"],
        zelfDoen: [
          "Bezig zijn met bezoekers",
          "Netheid van kantoor en kantine op orde houden",
          "Voorraadbeheer",
          "Cursistenadministratie beheren",
          "In- en verkoopfacturen kunnen verwerken",
          "Debiteurenbeheer",
          "Betalingen klaarzetten",
        ],
        systemen: ["Elzi", "AFAS basis", "Timewax"],
        collega: [
          "Meekijken met andere collega's van de afdeling om te begrijpen wat zij doen",
        ],
        trainingen: [],
      },
      3: {
        vereist: ["Kerncompetenties behalen", "Verbreding T-profiel"],
        zelfDoen: [
          "Nieuwsgierig zijn naar behoeften van klanten en daarop doorvragen",
          "Bezig zijn met wat andere collega's binnen Précon doen en welke invloed jullie werkzaamheden op elkaar hebben",
          "Voldoende kennis hebben van andere rollen op de Support afdeling om anderen te kunnen inwerken",
        ],
        systemen: ["Elzi", "AFAS", "Timewax"],
        collega: [
          "Meewerken met andere collega's van de afdeling om als back-up te kunnen fungeren",
          "Collega's inwerken op de diverse disciplines van Support",
          "Nieuwsgierig zijn hoe senior collega's van Support met klanten en interne klanten omgaan en wat zij doen om service te vergroten",
        ],
        trainingen: [],
      },
      4: {
        vereist: ["Kerncompetenties behalen", "Verbreding T-profiel"],
        zelfDoen: [
          "Nieuwsgierig zijn naar latente behoeften",
          "Jezelf uitdagen stappen vooruit te denken",
          "Bezig zijn met mogelijke verbeteringen in de verschillende werkprocessen",
        ],
        systemen: [
          "Elzi",
          "AFAS basis",
          "Timewax",
          "Diverse klanten- en arboportals",
        ],
        collega: [
          "Meewerken met andere collega's van de afdeling om als back-up te kunnen fungeren",
          "Deelnemen aan ontwikkeldagen van andere werelden om te begrijpen wat daar speelt",
          "Mee naar klanten om meer feeling te krijgen met wat daar nodig is",
        ],
        trainingen: ["AFAS-webinars volgen"],
      },
    },
  },
  leider: {
    label: "Leider",
    kleur: "leider",
    rollen: [
      "Support medewerker",
      "Buddy/Sparringspartner",
      "Projectleider",
      "Business manager",
      "MT-lid",
    ],
    vereisten: PADEN.leider.vereisten,
    toolboxen: {
      1: {
        vereist: ["Kerncompetenties behalen", "Inwerkprogramma goed afronden"],
        zelfDoen: [
          "Inhoudelijk werk doen: ga van start en leer van je collega's, durf vragen te stellen",
          "Vragen om feedback van collega's",
          "Je mening geven, ook bij twijfel",
        ],
        systemen: ["Elzi", "AFAS basis: uren schrijven"],
        collega: [
          "Meelopen met collega's in de inwerkperiode",
          "Samen met medior/senior collega's opdrachten uitvoeren die je meenemen in de inhoud van jouw werkzaamheden",
          "Gesprek voeren met je business manager of de salesmanager over de klant en de haakjes die je hebt gezien",
        ],
        trainingen: [
          "Starten met de inhoudelijke e-learnings en trainingen van Précon",
        ],
      },
      2: PADEN.leider.toolboxen[2] as Pad["toolboxen"][number],
      3: PADEN.leider.toolboxen[3] as Pad["toolboxen"][number],
      4: {
        vereist: [
          "Kerncompetenties behalen",
          "T-profiel verbreden en verdiepen",
          "Leiderschapsstijl van Précon begrijpen en naleven",
          "Kwetsbaar durven opstellen om eerlijk en open te zijn",
        ],
        zelfDoen: [
          "3 ankers van Précon bewust balanceren",
          "Gesprek voeren met de (interne) klant",
          "Welzijn en ontwikkeling van je teamleden",
          "Business plan van de wereld en doelstellingen doornemen",
        ],
        systemen: [
          "AFAS: HRM-portal, offertes, geschreven uren",
          "Klachten (intern en extern) over de interne processen monitoren",
        ],
        collega: [
          "Afstemming met MT-lid",
          "1:1 begeleiding of coaching",
          "Introductie door mede business manager of MT-lid in nieuwe medewerker begeleiden en gespreksvoering in de beoordelingscyclus (POP, FG)",
        ],
        trainingen: ["Trainingslijn 'Leider 3' volgen"],
      },
    },
  },
  // Bestaat niet in Support; blijft staan zodat de sleutels compleet zijn.
  trainer: { ...PADEN.trainer, rollen: [], vereisten: [], toolboxen: {} },
};

/** De paden die Support daadwerkelijk heeft, in weergavevolgorde. */
export const PAD_IDS_SUPPORT: PadId[] = ["vakexpert", "adviseur", "leider"];
