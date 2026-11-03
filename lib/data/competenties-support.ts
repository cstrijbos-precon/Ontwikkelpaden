import { COMPS } from "@/lib/data/competenties";
import type { Competentie, CompId, Ster } from "@/types/ontwikkelpaden";

/**
 * De kerncompetenties uit de Précon Ontwikkelpadengids Support (A-06-2). Waar
 * de Support-gids hetzelfde zegt als de standaardgids, komt de tekst uit
 * `COMPS`; alleen wat afwijkt staat hier. Training en coaching bestaat bij
 * Support niet.
 *
 * De gedragspunten staan in de gids als afbeelding en zijn hier overgetypt.
 */

const afsluiter = (ster: string) =>
  `Ga bij jezelf na of je de onderstaande punten beheerst en voorbeelden kan bedenken waarbij je deze hebt ingezet. Als je bij allemaal een goed praktijkvoorbeeld kan geven, beheers je deze ${ster} ster.`;

const voorbeeldsituaties = (ster: string, vraag: string) =>
  `Bedenk een aantal voorbeeld situaties uit de praktijk. ${vraag} Dan beheers je deze ${ster} ster.`;

const lijst = (...vragen: string[]) => vragen.map((v) => `• ${v}`).join("\n");

type Wijziging = Partial<Pick<Ster, "intro" | "kaderTitel" | "gedrag">>;

interface CompWijziging {
  definitie?: string;
  kernwoorden?: string[];
  /** Per ster (index 0 = 1e ster); `undefined` laat de standaardtekst staan. */
  sterren: (Wijziging | undefined)[];
}

const WIJZIGINGEN: Partial<Record<CompId, CompWijziging>> = {
  b: {
    sterren: [
      undefined,
      {
        gedrag: [
          "Heeft begrip en acceptatie voor standpunten en meningen van anderen en benut dit om begrip en enthousiasme voor eigen standpunten te verkrijgen;",
          "Past per situatie de argumenten en stijl van handelen aan en hanteert een aansprekende stijl om anderen enthousiast te maken voor eigen ideeën;",
          "Gaat in op wat gesprekspartners zeggen;",
          "Is een serieuze gesprekspartner en heeft oog voor de relatie met de ander;",
          "Brengt mening en verwachtingen duidelijk en beargumenteerd aan anderen over;",
        ],
      },
    ],
  },
  k: {
    definitie:
      "Herkennen van behoeften van de interne en externe klant en hiermee rekening houden in het handelen door het goed afwegen van het eigenbelang en het belang van de klant",
    kernwoorden: [
      "Brug tussen klant en service",
      "Inleven en meedenken",
      "Neemt klant en collega serieus",
      "Relatiegericht",
      "Verbeteren dienstverlening",
    ],
    sterren: [
      {
        intro: `Dit zien we als de basis van ons werk. De eerste ster zou na een half jaar ook behaald moeten zijn.\n\nVerder groeien op deze competentie gaat over het inzien van behoeftes van de klant, opbouwen van een klantrelatie en meedenken met de klant.\n\n${afsluiter("eerste")}`,
        kaderTitel:
          "Toont wezenlijk interesse in de wensen van (interne) klanten",
        gedrag: [
          "Is goed aanspreekbaar en bereikbaar voor de klant;",
          "Neemt een klacht, probleem of vraag van een klant serieus en reageert hier adequaat op;",
          "Houdt zich aan gemaakte afspraken met de klant; adviseert/bedient de klant volgens opdracht;",
          "Houdt de klant op de hoogte van de voortgang van de opdracht;",
          "Luistert aandachtig naar wensen van de klant en vraagt naar hun tevredenheid;",
          "Blijft rustig, correct, eerlijk en gaat niet in verdediging en uit geen beschuldiging naar klanten.",
        ],
      },
      {
        intro: `Deze tweede ster gaat over het dieper ingaan op de behoefte van de (zowel externe als interne) klant.\n\nVragen die je jezelf kan stellen zijn:\n${lijst(
          "Denk ik mee over de klantbeleving op kantoor? Ziet het kantoor er representatief uit?",
          "Zorg ik voor een juiste administratieve afhandeling naar de klant?",
          "Kan ik de vraag van de klant vertalen naar onze dienstverlening en de juiste collega aanhaken?",
          "Kan ik de externe klant verrassen door mee te denken en verschillende scenario's uit te werken?",
          "Kan ik een klacht afhandelen van een klant zonder tussenkomst van derden?",
        )}\n\nAls het gaat om interne klanten (je collega's) gaat deze ster over zaken zoals:\n${lijst(
          "Zorg ik ervoor dat mijn collega alles heeft om zich goed te kunnen voorbereiden?",
          "Ken ik mijn collega's en weet ik waar hun voorkeuren liggen, en kan ik daar op inspelen?",
          "Weet ik van mijn collega's de informatiebehoefte en lever ik dit tijdig aan?",
          "Ga ik integer om met de persoonsinformatie?",
          "Kan ik interne signalen oppikken en vertalen naar acties (om bijvoorbeeld verzuim te voorkomen)?",
        )}\n\n${afsluiter("tweede")}`,
        kaderTitel:
          "Speelt proactief in op wensen van (interne en externe) klanten",
        gedrag: [
          "Onderzoekt wensen/behoeften van klanten, luistert actief en vraagt door;",
          "Verdiept zich in de situatie van de klant, richt zich op verbetering, ontwikkelt een relatie met de klant en neemt acties om de tevredenheid te vergroten;",
          "Signaleert en herkent uitgesproken klantwensen en vertaalt deze naar activiteiten;",
          "Vertaalt vragen van klanten naar onze dienstverlening en haakt de juiste collega's aan;",
          "Komt met voorstellen waarin rekening is gehouden met de belangen van de klant, zonder dat dit nadelen voor de eigen organisatie oplevert;",
          "Verrast de klant met toegevoegde waarde;",
          "Is duidelijk naar de klant over de grenzen van de mogelijkheden.",
        ],
      },
      {
        intro: `Als je verder groeit op klantgerichtheid, ben je bezig met wat er speelt bij externe en interne klanten en denk je hierover mee. Je snapt hoe de klant werkt en wat deze nodig heeft en denkt creatief mee in mogelijke oplossingen voor problemen die spelen. Je snapt ook wat nodig is op kantoor en wat collega's nodig kunnen hebben.\n\nStel jezelf vragen zoals:\n${lijst(
          "Signaleer ik verlengingen en indexatie van opdrachten tijdig en speel ik hierop in door de juiste acties intern en extern uit te zetten?",
          "Speel ik proactief in op wensen van personeel op arbo-gebied?",
          "Weet ik wat de behoeftes zijn van onze trainers en bereid ik dit proactief voor? (denk aan zaal klaarzetten, techniek testen, kantine netjes etc.)",
          "Heb ik oog voor de uitstraling van onze kantoorruimten en speel ik hierop in?",
          "Wat heb ik gedaan om onze externe klanten nog beter te helpen?",
        )}\n\n${afsluiter("derde")}`,
        kaderTitel:
          "Kent de organisatie en de klanten en gebruikt die kennis tot wederzijds voordeel",
        gedrag: [
          "Heeft oog voor de uitstraling en functionaliteit van kantoorruimtes en onderneemt acties om deze te verbeteren;",
          "Kent de wensen van collega's en speelt hier proactief op in;",
          "Denkt mee met klanten over hun behoeften, geeft advies en biedt alternatieven aan als iets niet mogelijk is;",
          "Monitort de klanttevredenheid en verbetert de kwaliteit van de eigen dienstverlening;",
          "Speelt flexibel in op wensen van de klant;",
          "Bedenkt alternatieven om klantwensen te vervullen en biedt deze aan.",
        ],
      },
      {
        intro: `Dit is het hoogste niveau van klantgerichtheid. Je snapt interne processen en bent continu bezig om deze te optimaliseren om collega's beter te ondersteunen. Je snapt de externe klant en diens behoeftes. Je snapt de stakeholders bij de klant en wie je waarvoor moet hebben. Je hebt een bepaalde slimmigheid in het vinden van de juiste persoon op het juiste moment en bouwt een duurzame relatie op met deze contactpersonen.\n\nStel jezelf de volgende vragen:\n${lijst(
          "In hoeverre ben ik bezig met mogelijke verbeteringen van processen?",
          "Snap ik de invloed van deze processen op onze klanten? Voer ik de verbeteringen ook door om de klant verder te helpen?",
          "Snap ik waar deze processen anderen in de organisatie raken? Voer ik deze verbeteringen door om interne processen beter te maken?",
          "Begrijp ik hoe ik klachten bij onze klanten (die betrekking hebben op het handelen van onze afdeling) op kan lossen? En kan ik deze vertalen naar verbeteringen?",
        )}\n\n${afsluiter("vierde")}`,
        kaderTitel:
          "Denkt op management niveau mee met interne en externe klanten om hen vooruit te helpen",
        gedrag: [
          "Is continu bezig met verbetering van interne processen;",
          "Begrijpt de invloed van interne processen op klanten en voert deze door om klanten verder te helpen;",
          "Begrijpt de invloed van interne processen op anderen in de organisatie en voert deze door om interne processen te verbeteren;",
          "Verbetert de interne afstemming organisatie-breed om de klant beter te kunnen bedienen;",
          "Benut bestaande en nieuwe mogelijkheden om klanten optimaal te bedienen;",
          "Denkt op strategisch niveau mee met partners.",
        ],
      },
    ],
  },
  o: {
    kernwoorden: [
      "Initiatief",
      "Tonen van lef",
      "Anticiperen",
      "Kansen zien en nemen",
      "Marktsensitief",
      "Netwerken",
    ],
    sterren: [
      {
        intro: `Dit zien we als de basis van ons werk. De eerste ster zou na een half jaar ook behaald moeten zijn.\n\nVerder groeien op deze competentie gaat over meedenken over ontwikkelingen in de markt en kansen die dat meebrengt op gebied van nieuwe diensten voor Précon.\n\n${afsluiter("eerste")}`,
      },
      {
        intro: `Als je verder groeit op ondernemerschap, ben je sensitief voor ontwikkelingen die er spelen. Je bent nieuwsgierig, luistert goed en bent actief bezig met kansen.\n\n${afsluiter("tweede")}`,
        kaderTitel:
          "Weet wat Précon allemaal doet en kan en is vanuit daar bezig met kansen bij klanten",
        gedrag: [
          "Signaleert het als er meerdere vragen over een bepaald onderwerp binnen komen en geeft dit door aan de juiste persoon;",
          "Weet wat er speelt op eigen vakgebied en kan dit vertalen naar eigen persoonlijk ontwikkelplan;",
          "Staat open voor nieuwe ideeën en probeert nieuwe werkwijzen uit;",
          "Denkt mee over nieuwe verbeteringen in digitalisering en hoe deze de interne organisatie kunnen verbeteren.",
        ],
      },
      {
        intro: `Op dit niveau geef je zelf ook echt opvolging aan de kansen die je ziet. Naast het belang van de klant en de kansen die je daar ziet, ben je ook bezig met de kosten en baten voor Précon. Je kan ook eens met collega's sparren over signalen die zij bij klanten opvangen.\n\nStel jezelf vragen zoals:\n${lijst(
          "Ben ik bezig met ontwikkelingen in de markt (bv. relevante AFAS ontwikkelingen)? Wat doe ik hiermee in de interne organisatie?",
          "Doe ik wel eens kosten- en batenanalyses op projecten? Wat kan ik doen met de uitkomsten om de organisatie verder te helpen?",
          "Heb ik wel eens proactief de klantbeleving mbt OI's, administratie, klantopvolging en/of planning geëvalueerd? Wat kan ik met deze uitkomsten doen om de organisatie verder te helpen?",
        )}\n\n${afsluiter("derde")}`,
        kaderTitel: "Signaleert kansen in de markt en geeft opvolging daaraan",
        gedrag: [
          "Signaleert ontwikkelingen in de markt en kan deze integreren in de interne organisatie;",
          "Ondersteunt Précon door een goede profilering in de markt;",
          "Doet kosten- en batenanalyses op projecten en bespreekt deze proactief in de organisatie;",
          "Evalueert de klantbeleving met betrekking tot werkzaamheden van de afdelingen en stelt hierop verbeteringen voor.",
        ],
      },
      {
        intro: `Op dit niveau kan je zelf innovaties drijven. Jij bent je bewust van de kansen en ontwikkelingen in de markt en zet deze om in concrete verbetervoorstellen.\n\n${afsluiter("vierde")}`,
        gedrag: [
          "Bouwt een netwerk op om samenwerkingsverbanden te creëren en marktontwikkelingen op te volgen;",
          "Kan marktontwikkelingen voor verschillende onderdelen van de support afdeling omzetten in concrete verbeteringen.",
        ],
      },
    ],
  },
  org: {
    sterren: [
      {
        intro: `Dit zien we als de basis van ons werk. De eerste ster zou na een half jaar ook behaald moeten zijn.\n\nVerder groeien op deze competentie gaat over het organiseren, regelen en plannen van werkzaamheden.\n\n${afsluiter("eerste")}`,
      },
      {
        intro: `Op dit niveau ben je niet alleen bezig met het goed organiseren van je eigen werk, maar ook met het werk van anderen.\n\nStel jezelf vragen zoals:\n${lijst(
          "Kan ik goed prioriteiten aangeven voor mezelf en voor naaste collega's en dit volgen?",
          "Weet ik welke invloed mijn eigen werk heeft op dat van anderen en hoe speel ik hierop in?",
          "Bewaak ik deadlines en anticipeer ik hierop? (denk aan indexeren, rapportages, facturatie, inschrijvingstermijnen, belastingaangiftes, betalingen, arbeidscontracten)",
          "Kan ik mijn eigen en een gedeelde mailbox bijhouden?",
          "Bespreek ik knelpunten die ik zie?",
        )}\n\n${voorbeeldsituaties("tweede", "Pas jij onderstaande punten allemaal toe?")}`,
      },
      {
        intro: `Op dit niveau ben je niet alleen bezig met het goed organiseren van het werk van jezelf en anderen, maar ben je ook bezig met de voorwaarden en het te behalen resultaat. Je draagt verantwoordelijkheid voor goede afstemming van resources (mensen en middelen) en de benodigde tijd.\n\nStel jezelf de volgende vragen:\n${lijst(
          "Ben ik bezig met ieders rol in het interne proces? Zie ik de behoeftes van anderen en voorzie ik hierin?",
          "Sluit ik mensen van Support aan waar nodig?",
          "Ben ik bezig met verbeteringen van interne processen? Zie ik de invloed hiervan op andere interne processen?",
          "Initieer ik acties om deadlines te halen?",
        )}\n\n${voorbeeldsituaties("derde", "Kan je bij allemaal een succesvol voorbeeld geven?")}`,
      },
      {
        intro: `Op dit niveau ben je iemand die begrijpt hoe complexe, langere projecten georganiseerd moeten worden. Je kan een intern project opzetten en leiden.\n\n${voorbeeldsituaties("vierde", "Kan je bij allemaal een succesvol voorbeeld geven?")}`,
      },
    ],
  },
};

function pasToe(comp: Competentie): Competentie {
  const wijziging = WIJZIGINGEN[comp.id];
  if (!wijziging) return comp;
  return {
    ...comp,
    definitie: wijziging.definitie ?? comp.definitie,
    kernwoorden: wijziging.kernwoorden ?? comp.kernwoorden,
    sterren: comp.sterren.map((ster, i) => ({
      ...ster,
      ...wijziging.sterren[i],
    })),
  };
}

export const COMPS_SUPPORT: Competentie[] = COMPS.filter(
  (c) => c.id !== "t",
).map(pasToe);
