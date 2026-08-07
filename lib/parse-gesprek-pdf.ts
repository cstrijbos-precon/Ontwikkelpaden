import { extractText, getDocumentProxy } from "unpdf";
import {
  type ParsedGesprek,
  parseGesprekParagrafen,
} from "@/lib/parse-gesprek-tekst";

/**
 * Leest een PDF van een oud gesprek uit. De herkenning is dezelfde als bij
 * Word; alleen het uitpakken verschilt.
 *
 * Een PDF bewaart geen alinea's, alleen tekst op posities. Wat je terugkrijgt
 * zijn beeldregels: een zin die over drie regels loopt, komt als drie stukken
 * binnen. De labels staan in deze formulieren op hun eigen regel, dus de
 * herkenning werkt; lopende teksten worden weer aan elkaar geplakt.
 *
 * Bij een gescande PDF zit er geen tekstlaag in en valt er niets te lezen.
 * Daar geven we een duidelijke melding op in plaats van een leeg formulier.
 */
export async function parseGesprekPdf(
  buffer: ArrayBuffer,
): Promise<ParsedGesprek> {
  let tekst: string;

  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const resultaat = await extractText(pdf, { mergePages: true });
    tekst = Array.isArray(resultaat.text)
      ? resultaat.text.join("\n")
      : resultaat.text;
  } catch {
    throw new Error(
      "Kon de PDF niet openen. Is het bestand misschien beveiligd met een wachtwoord?",
    );
  }

  const regels = tekst
    .split(/\r?\n/)
    .map((regel) => regel.replace(/\s+/g, " ").trim())
    .filter((regel) => regel.length > 0);

  if (regels.length === 0) {
    throw new Error(
      "Deze PDF bevat geen leesbare tekst. Waarschijnlijk is het een scan of een foto; gebruik dan het Word-bestand.",
    );
  }

  const resultaat = parseGesprekParagrafen(regels, { regelScheiding: "\n" });
  resultaat.warnings.unshift(
    "Uit een PDF gelezen: de tekst is per regel overgenomen, dus loop de velden even na op afbrekingen.",
  );
  return resultaat;
}
