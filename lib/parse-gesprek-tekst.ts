import { clampScore, enforceDate } from "@/lib/field-format";
import type { CompId, OntwikkelpadenState } from "@/types/ontwikkelpaden";

export interface ParsedGesprek {
  state: Partial<OntwikkelpadenState>;
  warnings: string[];
}

/** Hoe losse regels tot één veldwaarde worden samengevoegd. */
export interface ParseOpties {
  /**
   * Word levert hele alinea's, dus daar hoort een lege regel tussen. Een PDF
   * levert losse beeldregels; die plakken we met een enkele newline aan elkaar,
   * anders krijgt elke afgebroken zin een witregel.
   */
  regelScheiding: string;
  /**
   * Alleen voor PDF. Een PDF breekt een alinea af op de breedte van de pagina,
   * niet op een zinseinde. Zonder dit staat er "van de\naanbesteding" midden
   * in een zin. Met dit aan worden zulke vervolgregels weer aan elkaar
   * geplakt; een regel die op een punt eindigt begint wel een nieuwe regel.
   */
  plakAfbrekingen?: boolean;
}

/** Eindigt deze regel een zin, of loopt hij door op de volgende regel? */
function isAfgerond(regel: string): boolean {
  return /[.!?:;]["')\]]?$/.test(regel.trim());
}

/** Begint deze regel een eigen punt (opsomming of nummering)? */
function isEigenRegel(regel: string): boolean {
  return /^([-•*–—]|\d+[.)]\s)/.test(regel.trim());
}

/**
 * Voegt losse regels samen tot veldtekst. Bij een PDF worden regels die
 * duidelijk één zin vormen weer aan elkaar geplakt met een spatie.
 */
function voegRegelsSamen(regels: string[], opties: ParseOpties): string {
  if (!opties.plakAfbrekingen) return regels.join(opties.regelScheiding).trim();

  let uit = "";
  for (const regel of regels) {
    if (!uit) {
      uit = regel;
      continue;
    }
    const vorigeLooptDoor = !isAfgerond(uit) && !isEigenRegel(regel);
    uit += vorigeLooptDoor ? ` ${regel}` : opties.regelScheiding + regel;
  }
  return uit.trim();
}

const MAANDEN: Record<string, string> = {
  jan: "01",
  feb: "02",
  mrt: "03",
  apr: "04",
  mei: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  okt: "10",
  nov: "11",
  dec: "12",
};

/**
 * "8-6-2026" of "8/6/2026" (dag-maand-jaar) -> YYYY-MM-DD. Het formulier
 * gebruikt daarnaast ook "4-aug-2026" (dag-maandnaam-jaar) — Word maakt daar
 * automatisch een datum met maandnaam van zodra iemand een cijferdatum intypt.
 */
function parseDutchDate(text: string): string {
  const numeriek = text.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (numeriek) {
    const [, d, mo, y] = numeriek;
    return enforceDate(
      `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    );
  }

  const metMaandnaam = text.match(/(\d{1,2})-([a-zé]{3,})-(\d{4})/i);
  if (metMaandnaam) {
    const [, d, maandTekst, y] = metMaandnaam;
    const maand = maandTekst && MAANDEN[maandTekst.slice(0, 3).toLowerCase()];
    if (maand) {
      return enforceDate(`${y}-${maand}-${String(d).padStart(2, "0")}`);
    }
  }

  return "";
}

/**
 * De score staat als sterren achter de competentie, op haar eigen regel
 * (label, dubbele punt, dan sterren tussen liggende streepjes). De toelichting
 * boven het formulier geeft ditzelfde label als voorbeeld, met drie sterren
 * erachter; daarom wordt hier per regel gematcht en niet op de hele tekst —
 * anders wint dat voorbeeld het van het echte antwoord eronder, gewoon omdat
 * het eerder komt.
 */
const COMP_LABELS: { id: CompId; pattern: RegExp }[] = [
  { id: "b", pattern: /^Be[iï]nvloedingskracht\s*:?\s*(.*)$/i },
  { id: "k", pattern: /^Klantgerichtheid\s*:?\s*(.*)$/i },
  { id: "o", pattern: /^Ondernemerschap\s*:?\s*(.*)$/i },
  { id: "org", pattern: /^Organisatievermogen\s*:?\s*(.*)$/i },
  { id: "t", pattern: /^Training en coaching\s*:?\s*(.*)$/i },
];

interface SterrenUitslag {
  score: number | null;
  /** Twee losse groepen sterren op één regel: iemand twijfelde, niet geraden. */
  onduidelijk: boolean;
}

/**
 * Haalt het aantal sterren uit de rest van de regel. Oude formulieren
 * gebruiken asterisken, soms omringd door liggende streepjes als lege plek;
 * de export van deze app zet er ★ neer met ☆ voor leeg. Alleen de gevulde
 * sterren tellen.
 *
 * Geen sterren op de regel betekent simpelweg: niet ingevuld — geen score,
 * geen waarschuwing. Twee losse groepen sterren op één regel is wél een
 * probleem: iemand twijfelde tussen twee waarden, en dan wordt er niets
 * geraden.
 */
function leesSterren(waarde: string): SterrenUitslag {
  const groepen = waarde.match(/[★*]+/g);
  if (!groepen) return { score: null, onduidelijk: false };
  if (groepen.length > 1) return { score: null, onduidelijk: true };
  return { score: clampScore(groepen[0].length), onduidelijk: false };
}

type SectionTarget =
  | { kind: "field"; key: keyof OntwikkelpadenState }
  | { kind: "situatie"; index: number }
  | { kind: "skip" };

interface Marker {
  pattern: RegExp;
  target: SectionTarget;
  /** Waarde staat direct ná deze regel i.p.v. erna verzameld te worden (label/waarde-paar). */
  inline?: boolean;
}

const MARKERS: Marker[] = [
  {
    pattern: /^naam professional$/i,
    target: { kind: "field", key: "naam" },
    inline: true,
  },
  {
    pattern: /^bij pr[eé]con sinds$/i,
    target: { kind: "field", key: "bijPreconSinds" },
    inline: true,
  },
  {
    pattern: /^datum vorig gesprek$/i,
    target: { kind: "field", key: "datumVorig" },
    inline: true,
  },
  {
    pattern: /^datum$/i,
    target: { kind: "field", key: "datum" },
    inline: true,
  },
  {
    pattern: /^hoofdbeoordelaar$/i,
    target: { kind: "field", key: "hoofdbeoordelaar" },
    inline: true,
  },
  {
    pattern: /^medebeoordelaar$/i,
    target: { kind: "field", key: "medebeoordelaar" },
    inline: true,
  },
  {
    pattern: /let op: is dit niet je functioneringsgesprek/i,
    target: { kind: "skip" },
  },
  {
    pattern: /^1\.\s*hoe gaat het met je\??$/i,
    target: { kind: "field", key: "hoeGaatHet" },
  },
  {
    pattern: /^werkdruk en ervaren belasting/i,
    target: { kind: "field", key: "werkdruk" },
  },
  { pattern: /^kernwaarden$/i, target: { kind: "field", key: "kernwaarden" } },
  {
    pattern: /^2\.\s*reflecteren op praktijksituaties/i,
    target: { kind: "skip" },
  },
  { pattern: /^situatie\s*1$/i, target: { kind: "situatie", index: 0 } },
  { pattern: /^situatie\s*2$/i, target: { kind: "situatie", index: 1 } },
  { pattern: /^situatie\s*3$/i, target: { kind: "situatie", index: 2 } },
  {
    pattern: /^overige gerealiseerde resultaten/i,
    target: { kind: "field", key: "impact" },
  },
  {
    pattern: /^declarabiliteit gepland en gerealiseerd$/i,
    target: { kind: "field", key: "declarabiliteit" },
  },
  {
    pattern: /^overige afspraken uit vorige? gesprek$/i,
    target: { kind: "field", key: "afspraken" },
  },
  { pattern: /^overige checks$/i, target: { kind: "field", key: "checks" } },
  {
    // Vaste tussentekst boven "3. Jouw profiel" op het formulier. Zonder deze
    // skip blijft hij aan het veld ervoor plakken (Overige checks).
    pattern: /^als je al een pop met de ontwikkelpaden hebt/i,
    target: { kind: "skip" },
  },
  {
    pattern: /^3\.\s*jouw profiel$/i,
    target: { kind: "field", key: "profiel" },
  },
  { pattern: /^4\.\s*inschalen/i, target: { kind: "skip" } },
  {
    pattern: /^diepte:?$/i,
    target: { kind: "field", key: "tDiepte" },
    inline: true,
  },
  {
    pattern: /^breedte:?$/i,
    target: { kind: "field", key: "tBreedte" },
    inline: true,
  },
  { pattern: /^5\.\s*ontwikkelpaden/i, target: { kind: "skip" } },
  {
    pattern: /^6\.\s*ambitie$/i,
    target: { kind: "field", key: "ambitieNotitie" },
  },
  { pattern: /^7\.\s*ontwikkeling$/i, target: { kind: "skip" } },
  {
    pattern: /^t-profiel ontwikkeling:?$/i,
    target: { kind: "field", key: "tProfielOntwikkeling" },
    inline: true,
  },
  {
    pattern: /^welke zaken uit de toolbox/i,
    target: { kind: "field", key: "toolboxKeuze" },
  },
  {
    pattern: /^kan je al checkpoints bedenken/i,
    target: { kind: "field", key: "checkpoints" },
  },
  {
    pattern: /^8\.\s*eventuele overige afspraken$/i,
    target: { kind: "field", key: "overigeAfspraken" },
  },
  {
    pattern: /^9\.\s*datum volgend functioneringsgesprek$/i,
    target: { kind: "field", key: "datumVolgend" },
  },
  { pattern: /^ondertekening voor akkoord$/i, target: { kind: "skip" } },
];

const REQUIRED_SECTION_LABELS = [
  "1. Hoe gaat het met je?",
  "2. Reflecteren op praktijksituaties",
  "3. Jouw profiel",
  "4. Inschalen",
  "6. Ambitie",
];

/**
 * De labels uit de koptabel van het formulier, langste eerst zodat
 * "Datum vorig gesprek" wint van "Datum". Alleen de PDF-lezer gebruikt deze
 * lijst: Word levert elke tabelcel als eigen alinea, een PDF plakt de hele
 * rij aan elkaar. Houd hem gelijk met de `inline`-markers hieronder.
 */
export const TABEL_LABELS = [
  "Datum vorig gesprek",
  "Naam professional",
  "Bij Précon sinds",
  "Bij Precon sinds",
  "Hoofdbeoordelaar",
  "Medebeoordelaar",
  // "Datum" alleen aan het begin van een regel: los komt het woord overal in
  // lopende tekst voor, en dan zou de hele zin erachter de datum worden.
  "^Datum",
];

/** Velden die de app als datum bewaart (JJJJ-MM-DD). */
const DATUMVELDEN = ["datum", "datumVorig", "datumVolgend"];

function matchMarker(text: string): Marker | null {
  return MARKERS.find((m) => m.pattern.test(text)) ?? null;
}

export function parseGesprekParagrafen(
  paragraphs: string[],
  opties: ParseOpties,
): ParsedGesprek {
  const warnings: string[] = [];

  const textFields: Partial<Record<keyof OntwikkelpadenState, string[]>> = {};
  const situaties: string[][] = [[], [], []];
  let current: SectionTarget = { kind: "skip" };
  let inlineNextIsValue: keyof OntwikkelpadenState | null = null;
  const inschalenLines: string[] = [];
  const foundSections = new Set<string>();

  for (const text of paragraphs) {
    const marker = matchMarker(text);

    if (marker) {
      if (inlineNextIsValue) inlineNextIsValue = null;
      current = marker.target;
      if (marker.target.kind === "field" && marker.inline) {
        inlineNextIsValue = marker.target.key;
      }
      for (const label of REQUIRED_SECTION_LABELS) {
        if (marker.pattern.test(label)) foundSections.add(label);
      }
      continue;
    }

    if (inlineNextIsValue) {
      // Eerste vondst wint. In een PDF komt een label soms nog een keer voor
      // (bijvoorbeeld in het ondertekeningsblok); dat mag de echte waarde
      // uit de kop niet overschrijven.
      if (!textFields[inlineNextIsValue]) {
        textFields[inlineNextIsValue] = [text];
      }
      inlineNextIsValue = null;
      // Een label/waarde-paar is hiermee klaar. Zonder deze regel bleef alles
      // wat erna kwam aan dit veld geplakt worden tot het volgende kopje —
      // in Word onzichtbaar, in een PDF goed voor een naamveld vol tekst.
      current = { kind: "skip" };
      continue;
    }

    if (current.kind === "skip") continue;
    if (current.kind === "situatie") {
      situaties[current.index]?.push(text);
      continue;
    }
    if (current.kind === "field") {
      if (!textFields[current.key]) textFields[current.key] = [];
      textFields[current.key]?.push(text);
    }
  }

  // Sterrenscores: alleen binnen het "4. Inschalen"-blok, om te voorkomen dat
  // ambitie-teksten uit stap 7 ("van ** naar ***") worden aangezien voor het huidige niveau.
  {
    let inInschalen = false;
    for (const text of paragraphs) {
      if (/^4\.\s*inschalen/i.test(text)) {
        inInschalen = true;
        continue;
      }
      if (/^5\.\s*ontwikkelpaden/i.test(text)) {
        inInschalen = false;
        continue;
      }
      if (inInschalen) inschalenLines.push(text);
    }
  }

  const scores: Partial<Record<CompId, number>> = {};
  for (const { id, pattern } of COMP_LABELS) {
    for (const regel of inschalenLines) {
      const m = regel.match(pattern);
      if (!m) continue;
      const { score, onduidelijk } = leesSterren(m[1] ?? "");
      if (onduidelijk) {
        warnings.push(
          `Score voor "${regel.split(":")[0]?.trim()}" is niet eenduidig ("${regel}") — vul deze handmatig in.`,
        );
      } else if (score !== null) {
        scores[id] = score;
      }
      break;
    }
  }

  const signOffDate = paragraphs.find((t) => /^datum\s*:/i.test(t));
  const ondertekeningDatum = signOffDate ? parseDutchDate(signOffDate) : "";

  const state: Partial<OntwikkelpadenState> = {};
  for (const [key, lines] of Object.entries(textFields)) {
    const value = voegRegelsSamen(lines ?? [], opties);
    if (!value) continue;

    // De formulieren schrijven datums als 9-6-2026; de app bewaart ze als
    // 2026-06-09. Zonder deze omzetting valt de waarde bij het opslaan weg.
    if (DATUMVELDEN.includes(key)) {
      const omgezet = parseDutchDate(value);
      if (omgezet) (state as Record<string, unknown>)[key] = omgezet;
      continue;
    }

    (state as Record<string, unknown>)[key] = value;
  }
  if (situaties.some((s) => s.length > 0)) {
    state.situaties = situaties.map((lines) => voegRegelsSamen(lines, opties));
  }
  if (Object.keys(scores).length > 0) {
    state.scores = scores as Record<CompId, number>;
  }
  if (!state.datum && ondertekeningDatum) {
    state.datum = ondertekeningDatum;
  }

  for (const label of REQUIRED_SECTION_LABELS) {
    if (!foundSections.has(label)) {
      warnings.push(
        `Sectie "${label}" is niet herkend in dit document — controleer of alle gegevens zijn overgenomen.`,
      );
    }
  }
  warnings.push(
    "Het ontwikkelpaden-diagram (vorig jaar/ambitie per pad) kan niet automatisch worden overgenomen — stel dit opnieuw in op stap 6 en 7.",
  );

  return { state, warnings };
}
