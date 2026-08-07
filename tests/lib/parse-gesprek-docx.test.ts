import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { parseGesprekDocx } from "@/lib/parse-gesprek-docx";

/** Bouwt een minimale .docx-buffer met de gegeven paragraaf-teksten. */
async function buildDocx(paragraphs: string[]): Promise<ArrayBuffer> {
  const body = paragraphs
    .map(
      (text) => `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`,
    )
    .join("");
  const xml = `<?xml version="1.0"?><w:document><w:body>${body}</w:body></w:document>`;

  const zip = new JSZip();
  zip.file("word/document.xml", xml);
  return zip.generateAsync({ type: "arraybuffer" });
}

describe("parseGesprekDocx", () => {
  it("gooit een fout op een bestand zonder word/document.xml", async () => {
    const zip = new JSZip();
    zip.file("readme.txt", "geen docx");
    const buffer = await zip.generateAsync({ type: "arraybuffer" });

    await expect(parseGesprekDocx(buffer)).rejects.toThrow(
      "Geen geldig .docx-bestand",
    );
  });

  it("leest inline labelvelden (naam, data, beoordelaars)", async () => {
    const buffer = await buildDocx([
      "Naam professional",
      "Chantal de Vries",
      "Bij Précon sinds",
      "januari 2022",
      "Datum vorig gesprek",
      "1-6-2025",
      "Hoofdbeoordelaar",
      "Eva van Kouwen",
      "Medebeoordelaar",
      "Jan Jansen",
    ]);

    const { state } = await parseGesprekDocx(buffer);

    expect(state.naam).toBe("Chantal de Vries");
    expect(state.bijPreconSinds).toBe("januari 2022");
    // De formulieren schrijven datums als 1-6-2025, maar de app bewaart ze als
    // JJJJ-MM-DD. Zonder omzetting gooide enforceDate de waarde bij het opslaan
    // weg, en verdween de datum zonder melding.
    expect(state.datumVorig).toBe("2025-06-01");
    expect(state.hoofdbeoordelaar).toBe("Eva van Kouwen");
    expect(state.medebeoordelaar).toBe("Jan Jansen");
  });

  it("plakt geen losse tekst meer achter een inline veld", async () => {
    const buffer = await buildDocx([
      "Medebeoordelaar",
      "Jan Jansen",
      "Een losse regel die er niet bij hoort.",
    ]);

    const { state } = await parseGesprekDocx(buffer);
    expect(state.medebeoordelaar).toBe("Jan Jansen");
  });

  it("verzamelt meerdere alinea's onder een sectiekop tot één veld", async () => {
    const buffer = await buildDocx([
      "1. Hoe gaat het met je?",
      "Het gaat goed.",
      "Ik voel me gesteund door het team.",
      "Werkdruk en ervaren belasting",
      "Prima werkdruk.",
    ]);

    const { state } = await parseGesprekDocx(buffer);

    expect(state.hoeGaatHet).toBe(
      "Het gaat goed.\n\nIk voel me gesteund door het team.",
    );
    expect(state.werkdruk).toBe("Prima werkdruk.");
  });

  it("verdeelt praktijksituaties over de drie situatie-slots", async () => {
    const buffer = await buildDocx([
      "2. Reflecteren op praktijksituaties",
      "Situatie 1",
      "Casus met een klant.",
      "Situatie 2",
      "Casus met een collega.",
      "Situatie 3",
      "Casus met een leverancier.",
    ]);

    const { state } = await parseGesprekDocx(buffer);

    expect(state.situaties).toEqual([
      "Casus met een klant.",
      "Casus met een collega.",
      "Casus met een leverancier.",
    ]);
  });

  it("leest sterrenscores alleen binnen het Inschalen-blok", async () => {
    const buffer = await buildDocx([
      "4. Inschalen",
      "Beïnvloedingskracht: ***",
      "Klantgerichtheid: **",
      "5. Ontwikkelpaden",
      "6. Ambitie",
      "Van ** naar *****, dat is de ambitie voor Beïnvloedingskracht.",
    ]);

    const { state } = await parseGesprekDocx(buffer);

    expect(state.scores?.b).toBe(3);
    expect(state.scores?.k).toBe(2);
  });

  it("gebruikt de ondertekeningsdatum als datum niet elders is gevonden", async () => {
    const buffer = await buildDocx([
      "Naam professional",
      "Chantal de Vries",
      "Ondertekening voor akkoord",
      "Datum: 8-6-2026",
    ]);

    const { state } = await parseGesprekDocx(buffer);

    expect(state.datum).toBe("2026-06-08");
  });

  it("decodeert XML-entiteiten in de tekst", async () => {
    const buffer = await buildDocx([
      "Naam professional",
      "Jan &amp; Piet &lt;test&gt; &quot;citaat&quot; &apos;s",
    ]);

    const { state } = await parseGesprekDocx(buffer);

    expect(state.naam).toBe(`Jan & Piet <test> "citaat" 's`);
  });

  it("waarschuwt over niet-herkende verplichte secties en het ontwikkelpaden-diagram", async () => {
    const buffer = await buildDocx(["Naam professional", "Chantal de Vries"]);

    const { warnings } = await parseGesprekDocx(buffer);

    expect(warnings).toContain(
      'Sectie "1. Hoe gaat het met je?" is niet herkend in dit document — controleer of alle gegevens zijn overgenomen.',
    );
    expect(warnings.some((w) => w.includes("ontwikkelpaden-diagram"))).toBe(
      true,
    );
  });

  it("geeft geen sectie-waarschuwing als alle verplichte secties aanwezig zijn", async () => {
    const buffer = await buildDocx([
      "1. Hoe gaat het met je?",
      "Tekst.",
      "2. Reflecteren op praktijksituaties",
      "3. Jouw profiel",
      "Profieltekst.",
      "4. Inschalen",
      "5. Ontwikkelpaden",
      "6. Ambitie",
      "Ambitietekst.",
    ]);

    const { warnings } = await parseGesprekDocx(buffer);

    expect(warnings.filter((w) => w.startsWith("Sectie"))).toHaveLength(0);
  });
});
