import JSZip from "jszip";
import { clampScore, enforceDate } from "@/lib/field-format";
import type { CompId, OntwikkelpadenState } from "@/types/ontwikkelpaden";

export interface ParsedGesprekDocx {
  state: Partial<OntwikkelpadenState>;
  warnings: string[];
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeXmlEntities(text: string): string {
  return text.replace(
    /&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g,
    (m, ent: string) => {
      if (ent in ENTITIES) return ENTITIES[ent] as string;
      if (ent.startsWith("#x"))
        return String.fromCodePoint(parseInt(ent.slice(2), 16));
      if (ent.startsWith("#"))
        return String.fromCodePoint(parseInt(ent.slice(1), 10));
      return m;
    },
  );
}

async function extractParagraphs(buffer: ArrayBuffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file("word/document.xml");
  if (!file) {
    throw new Error("Geen geldig .docx-bestand (word/document.xml ontbreekt).");
  }
  const xml = await file.async("string");
  const blocks = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? [];

  return blocks
    .map((block) => {
      const runs = block.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) ?? [];
      return decodeXmlEntities(
        runs
          .map((r) => r.replace(/^<w:t[^>]*>/, "").replace(/<\/w:t>$/, ""))
          .join(""),
      ).trim();
    })
    .filter((text) => text.length > 0);
}

const COMP_LABELS: { id: CompId; pattern: RegExp }[] = [
  { id: "b", pattern: /Be[iï]nvloedingskracht\s*:?\s*_*(\*+)/i },
  { id: "k", pattern: /Klantgerichtheid\s*:?\s*_*(\*+)/i },
  { id: "o", pattern: /Ondernemerschap\s*:?\s*_*(\*+)/i },
  { id: "org", pattern: /Organisatievermogen\s*:?\s*_*(\*+)/i },
  { id: "t", pattern: /Training en coaching\s*:?\s*_*(\*+)/i },
];

/** "8-6-2026" of "8/6/2026" (dag-maand-jaar, zoals in de oude formulieren) -> YYYY-MM-DD. */
function parseDutchDate(text: string): string {
  const m = text.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (!m) return "";
  const [, d, mo, y] = m;
  return enforceDate(
    `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
  );
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

function matchMarker(text: string): Marker | null {
  return MARKERS.find((m) => m.pattern.test(text)) ?? null;
}

export async function parseGesprekDocx(
  buffer: ArrayBuffer,
): Promise<ParsedGesprekDocx> {
  const paragraphs = await extractParagraphs(buffer);
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
      textFields[inlineNextIsValue] = [text];
      inlineNextIsValue = null;
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
  const inschalenText = inschalenLines.join("\n");
  for (const { id, pattern } of COMP_LABELS) {
    const m = inschalenText.match(pattern);
    if (m?.[1]) scores[id] = clampScore(m[1].length);
  }

  const signOffDate = paragraphs.find((t) => /^datum\s*:/i.test(t));
  const ondertekeningDatum = signOffDate ? parseDutchDate(signOffDate) : "";

  const state: Partial<OntwikkelpadenState> = {};
  for (const [key, lines] of Object.entries(textFields)) {
    const value = (lines ?? []).join("\n\n").trim();
    if (value) (state as Record<string, unknown>)[key] = value;
  }
  if (situaties.some((s) => s.length > 0)) {
    state.situaties = situaties.map((lines) => lines.join("\n\n").trim());
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
