/**
 * Eenmalige import: leest het tabblad "Vlootschouw" uit een Excel-bestand
 * (naam, wereld, niveau per pad) en zet dat om in gesprekken/gesprek_paden-
 * rijen, zodat de vlootschouw meteen een gevulde "nu aanwezig"-baseline heeft
 * in plaats van leeg te starten.
 *
 * Gebruik: node scripts/import-vlootschouw-baseline.mjs "<pad-naar-excel.xlsx>" "<jouw-email>"
 *
 * Vereist DATABASE_URL in .env.local. Voegt alleen nieuwe rijen toe (met
 * medewerker_email = NULL, dus onzichtbaar in ieders persoonlijke dashboard);
 * raakt geen bestaande data aan.
 */
import { readFileSync } from "node:fs";
import { Client } from "@neondatabase/serverless";
import { XMLParser } from "fast-xml-parser";
import JSZip from "jszip";

const PAD_KOLOMMEN = {
  vakexpert: "D",
  adviseur: "E",
  leider: "F",
  trainer: "G",
};
const WERELDEN = ["QA", "RA", "NF", "Learning", "Overhead"];

function loadDatabaseUrl() {
  const envText = readFileSync(".env.local", "utf8");
  for (const line of envText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    if (trimmed.slice(0, idx).trim() === "DATABASE_URL") {
      return trimmed
        .slice(idx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
  throw new Error("DATABASE_URL niet gevonden in .env.local");
}

function parseRef(ref) {
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  return { col: m[1], row: Number.parseInt(m[2], 10) };
}

async function parseVlootschouwSheet(filePath) {
  const buf = readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  let sharedStrings = [];
  const ssFile = zip.file("xl/sharedStrings.xml");
  if (ssFile) {
    const ss = parser.parse(await ssFile.async("string"));
    let items = ss.sst?.si ?? [];
    if (!Array.isArray(items)) items = [items];
    sharedStrings = items.map((it) => {
      if (typeof it === "object" && it.t !== undefined) {
        return typeof it.t === "object" ? (it.t["#text"] ?? "") : String(it.t);
      }
      if (typeof it === "object" && it.r) {
        const r = Array.isArray(it.r) ? it.r : [it.r];
        return r
          .map((run) =>
            typeof run.t === "object" ? (run.t["#text"] ?? "") : (run.t ?? ""),
          )
          .join("");
      }
      return "";
    });
  }

  const wb = parser.parse(await zip.file("xl/workbook.xml").async("string"));
  let sheets = wb.workbook.sheets.sheet;
  if (!Array.isArray(sheets)) sheets = [sheets];
  const vlootschouwSheet = sheets.find((s) => s["@_name"] === "Vlootschouw");
  if (!vlootschouwSheet) throw new Error('Tabblad "Vlootschouw" niet gevonden');

  const rels = parser.parse(
    await zip.file("xl/_rels/workbook.xml.rels").async("string"),
  );
  let relArr = rels.Relationships.Relationship;
  if (!Array.isArray(relArr)) relArr = [relArr];
  const relMap = Object.fromEntries(
    relArr.map((r) => [r["@_Id"], r["@_Target"]]),
  );
  const target = relMap[vlootschouwSheet["@_r:id"]];
  const sheetPath = `xl/${target.replace(/^\/?xl\//, "")}`;

  const sheetXml = await zip.file(sheetPath).async("string");
  const sheetData = parser.parse(sheetXml);
  let rows = sheetData.worksheet.sheetData.row;
  if (!Array.isArray(rows)) rows = [rows];

  const personen = [];
  for (const row of rows) {
    const rowNum = Number(row["@_r"]);
    if (rowNum <= 2) continue; // header-rijen overslaan

    let cells = row.c;
    if (!cells) continue;
    if (!Array.isArray(cells)) cells = [cells];

    const waarden = {};
    for (const c of cells) {
      const { col } = parseRef(c["@_r"]);
      let v = c.v;
      if (v === undefined) continue;
      if (c["@_t"] === "s") v = sharedStrings[Number.parseInt(v, 10)] ?? "";
      waarden[col] = v;
    }

    const naam = String(waarden.A ?? "").trim();
    const wereld = String(waarden.B ?? "").trim();
    if (!naam || !WERELDEN.includes(wereld)) continue;

    const niveaus = {};
    for (const [padId, kolom] of Object.entries(PAD_KOLOMMEN)) {
      const raw = waarden[kolom];
      const n = Number.parseInt(String(raw ?? ""), 10);
      niveaus[padId] = Number.isInteger(n) && n >= 1 && n <= 5 ? n : 0;
    }

    personen.push({ naam, wereld, niveaus });
  }

  return personen;
}

async function main() {
  const [, , excelPad, importerEmail, vlag] = process.argv;
  if (!excelPad || !importerEmail) {
    console.error(
      'Gebruik: node scripts/import-vlootschouw-baseline.mjs "<pad-naar-excel.xlsx>" "<jouw-email>" [--dry-run]',
    );
    process.exit(1);
  }

  const personen = await parseVlootschouwSheet(excelPad);
  console.log(`${personen.length} medewerkers gevonden in de Excel.`);

  if (vlag === "--dry-run") {
    console.log("Dry run — geen database-schrijfacties. Voorbeeldrijen:");
    console.log(personen.slice(0, 5));
    console.log("...");
    console.log(personen.slice(-5));
    const perWereld = {};
    for (const p of personen)
      perWereld[p.wereld] = (perWereld[p.wereld] ?? 0) + 1;
    console.log("Aantal per wereld:", perWereld);
    return;
  }

  const client = new Client(loadDatabaseUrl());
  await client.connect();
  try {
    let aangemaakt = 0;
    for (const persoon of personen) {
      const gesprekResult = await client.query(
        `INSERT INTO gesprekken (
           medewerker_naam, medewerker_email, wereld, bij_precon_sinds,
           hoofdbeoordelaar, medebeoordelaar, state, status, created_by, updated_by
         ) VALUES ($1, NULL, $2, '', '', '', $3, 'completed', $4, $4)
         RETURNING id`,
        [persoon.naam, persoon.wereld, JSON.stringify({}), importerEmail],
      );
      const gesprekId = gesprekResult.rows[0].id;

      for (const [padId, niveau] of Object.entries(persoon.niveaus)) {
        await client.query(
          `INSERT INTO gesprek_paden (
             gesprek_id, pad_id, vorig_jaar_niveau, ambitie, trainingsgroep_id, huidig_niveau
           ) VALUES ($1, $2, 0, false, '', $3)`,
          [gesprekId, padId, niveau],
        );
      }
      aangemaakt += 1;
    }
    console.log(
      `${aangemaakt} gesprekken aangemaakt als vlootschouw-baseline.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
