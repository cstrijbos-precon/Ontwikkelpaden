import JSZip from "jszip";
import {
  type ParsedGesprek,
  parseGesprekParagrafen,
} from "@/lib/parse-gesprek-tekst";

export type { ParsedGesprek as ParsedGesprekDocx };

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

export async function parseGesprekDocx(
  buffer: ArrayBuffer,
): Promise<ParsedGesprek> {
  const paragraphs = await extractParagraphs(buffer);
  // Word geeft hele alinea's terug; die horen door een witregel gescheiden.
  return parseGesprekParagrafen(paragraphs, { regelScheiding: "\n\n" });
}
