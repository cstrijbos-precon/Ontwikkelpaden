import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { herkenBestandstype } from "@/lib/bestandstype";
import { parseGesprekPdf } from "@/lib/parse-gesprek-pdf";

/** Bouwt een PDF met dezelfde koppen als de oude formulieren. */
function maakPdf(regels: string[]): ArrayBuffer {
  const doc = new jsPDF();
  regels.forEach((regel, i) => doc.text(regel, 15, 15 + i * 7));
  return doc.output("arraybuffer");
}

const FORMULIER = [
  "Naam professional",
  "Jan de Vries",
  "Bij Precon sinds",
  "2021",
  "Hoofdbeoordelaar",
  "Kim Bakker",
  "1. Hoe gaat het met je?",
  "Het gaat goed dit jaar.",
  "Werkdruk en ervaren belasting",
  "Af en toe pieken rond deadlines.",
  "2. Reflecteren op praktijksituaties",
  "Situatie 1",
  "Aanbesteding bij de gemeente afgerond.",
  "3. Jouw profiel",
  "Inhoudelijk sterk, groeit in advies.",
  "4. Inschalen",
  "Beinvloedingskracht: **",
  "Klantgerichtheid: ***",
  "Ondernemerschap: **",
  "Organisatievermogen: *",
  "5. Ontwikkelpaden",
  "6. Ambitie",
  "Doorgroeien richting adviseur.",
];

describe("parseGesprekPdf", () => {
  it("leest de velden uit een PDF met dezelfde koppen als het Word-formulier", async () => {
    const { state } = await parseGesprekPdf(maakPdf(FORMULIER));

    expect(state.naam).toBe("Jan de Vries");
    expect(state.bijPreconSinds).toBe("2021");
    expect(state.hoofdbeoordelaar).toBe("Kim Bakker");
    expect(state.hoeGaatHet).toContain("Het gaat goed");
    expect(state.werkdruk).toContain("pieken");
    expect(state.profiel).toContain("Inhoudelijk sterk");
    expect(state.ambitieNotitie).toContain("adviseur");
    expect(state.situaties?.[0]).toContain("Aanbesteding");
  });

  it("leest de sterrenscores", async () => {
    const { state } = await parseGesprekPdf(maakPdf(FORMULIER));

    expect(state.scores).toMatchObject({ b: 2, k: 3, o: 2, org: 1 });
  });

  it("waarschuwt dat de tekst per regel is overgenomen", async () => {
    const { warnings } = await parseGesprekPdf(maakPdf(FORMULIER));
    expect(warnings[0]).toContain("per regel");
  });

  it("meldt duidelijk dat een PDF zonder tekstlaag niet gaat", async () => {
    // Een PDF zonder enige tekst staat voor een scan of foto.
    const leeg = new jsPDF().output("arraybuffer");

    await expect(parseGesprekPdf(leeg)).rejects.toThrow(/scan of een foto/);
  });

  it("meldt een onleesbaar bestand in plaats van te klappen", async () => {
    const rommel = new TextEncoder().encode("dit is geen pdf").buffer;
    await expect(parseGesprekPdf(rommel as ArrayBuffer)).rejects.toThrow();
  });
});

describe("koptabel uit een PDF", () => {
  // Word geeft elke cel als eigen alinea; een PDF plakt de hele rij aaneen.
  const KOPREGELS = [
    "Naam professional Jan de Vries Bij Precon sinds 1-1-2021",
    "Datum 9-6-2026 Datum vorig gesprek 8-1-2026",
    "Hoofdbeoordelaar Kim Bakker Medebeoordelaar Eva van Kouwen",
  ];

  it("haalt de kopgegevens uit samengeplakte tabelrijen", async () => {
    const { state } = await parseGesprekPdf(maakPdf(KOPREGELS));

    expect(state.naam).toBe("Jan de Vries");
    expect(state.bijPreconSinds).toBe("1-1-2021");
    expect(state.hoofdbeoordelaar).toBe("Kim Bakker");
    expect(state.medebeoordelaar).toBe("Eva van Kouwen");
  });

  it("zet de Nederlandse datums om naar het formaat van de app", async () => {
    const { state } = await parseGesprekPdf(maakPdf(KOPREGELS));

    expect(state.datum).toBe("2026-06-09");
    expect(state.datumVorig).toBe("2026-01-08");
  });

  it("laat het woord datum in lopende tekst met rust", async () => {
    const { state } = await parseGesprekPdf(
      maakPdf([
        "Datum 9-6-2026",
        "1. Hoe gaat het met je?",
        "We hebben op die datum afgesproken dat het beter zou gaan.",
      ]),
    );

    // Zonder de ankering aan het regelbegin slokte "datum" de hele zin op.
    expect(state.datum).toBe("2026-06-09");
    expect(state.hoeGaatHet).toContain("beter zou gaan");
  });

  it("neemt de eerste vondst en niet die uit het ondertekeningsblok", async () => {
    const { state } = await parseGesprekPdf(
      maakPdf([
        "Hoofdbeoordelaar Kim Bakker Medebeoordelaar Eva van Kouwen",
        "Ondertekening voor akkoord",
        "Professional: Hoofdbeoordelaar: Medebeoordelaar:",
      ]),
    );

    expect(state.hoofdbeoordelaar).toBe("Kim Bakker");
    expect(state.medebeoordelaar).toBe("Eva van Kouwen");
  });
});

describe("herkenBestandstype", () => {
  it("herkent een PDF aan de eerste bytes", () => {
    expect(herkenBestandstype(maakPdf(["test"]))).toBe("pdf");
  });

  it("herkent een docx aan de zip-signatuur", () => {
    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04]).buffer;
    expect(herkenBestandstype(zip)).toBe("docx");
  });

  it("geeft null bij iets anders", () => {
    const tekst = new TextEncoder().encode("gewoon tekst").buffer;
    expect(herkenBestandstype(tekst as ArrayBuffer)).toBeNull();
  });
});
