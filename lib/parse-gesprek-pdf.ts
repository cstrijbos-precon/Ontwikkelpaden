import { extractText, getDocumentProxy } from "unpdf";
import {
  type ParsedGesprek,
  parseGesprekParagrafen,
  TABEL_LABELS,
} from "@/lib/parse-gesprek-tekst";

/**
 * Een label mag met `^` beginnen; dat betekent "alleen aan het begin van de
 * regel". De rest van de tekens wordt letterlijk genomen.
 */
function labelNaarPatroon(label: string): string {
  const aanBegin = label.startsWith("^");
  const tekst = aanBegin ? label.slice(1) : label;
  const geescaped = tekst.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return aanBegin ? `^${geescaped}` : geescaped;
}

/**
 * Word geeft elke tabelcel als eigen alinea; een PDF plakt de hele rij aan
 * elkaar tot "Naam professional Jan de Vries Bij Précon sinds 1-1-2021".
 * Hier knippen we zo'n regel weer uit elkaar in label- en waardestukken,
 * zodat de gewone herkenning er wél raad mee weet.
 */
export function splitsTabelregels(regels: string[]): string[] {
  const patroon = new RegExp(
    `(${TABEL_LABELS.map(labelNaarPatroon).join("|")})`,
    "gi",
  );

  const uit: string[] = [];
  for (const regel of regels) {
    const delen = regel
      .split(patroon)
      .map((deel) => deel.trim())
      .filter(Boolean);

    // Eén stuk betekent: geen label gevonden, of de regel ís het label.
    if (delen.length <= 1) {
      uit.push(regel);
      continue;
    }
    uit.push(...delen);
  }
  return uit;
}

/** "Pagina 3 van 8", "3 / 8", "Blad 2" — wat de printer eronder zet. */
const PAGINA_AANDUIDING =
  /^\s*(pagina|blad|page)?\s*\d+\s*(van|\/|of)\s*\d+\s*$|pagina\s*\d+\s*(van|\/)\s*\d+/i;

/**
 * Kop- en voetregels staan op elke pagina en horen bij geen enkel veld. Zonder
 * dit belandt "F-04 Functioneringsgesprek Pagina 1 van 3" onderaan de tekst
 * van het veld dat toevallig over die paginagrens liep.
 *
 * Twee zeefjes: een regel met een paginanummering erin gaat er altijd uit, en
 * een korte regel die op drie of meer pagina's letterlijk terugkomt is een
 * vaste kop- of voetregel. Lange regels blijven staan: die kunnen echte tekst
 * zijn die iemand herhaalt.
 */
export function verwijderKopEnVoetregels(regels: string[]): string[] {
  const telling = new Map<string, number>();
  for (const regel of regels) {
    telling.set(regel, (telling.get(regel) ?? 0) + 1);
  }

  return regels.filter((regel) => {
    if (PAGINA_AANDUIDING.test(regel)) return false;
    const vaak = (telling.get(regel) ?? 0) >= 3;
    return !(vaak && regel.length <= 80);
  });
}

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

  const schoon = verwijderKopEnVoetregels(regels);

  const resultaat = parseGesprekParagrafen(splitsTabelregels(schoon), {
    regelScheiding: "\n",
    plakAfbrekingen: true,
  });
  resultaat.warnings.unshift(
    "Uit een PDF gelezen: afgebroken zinnen zijn weer aan elkaar geplakt en kop- en voetregels weggelaten. Loop de velden even na.",
  );
  return resultaat;
}
