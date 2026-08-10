/**
 * Eenmalige import: leest het tabblad "Strategische personeelsplanning" uit
 * een Excel-bestand (4 blokken naast elkaar, één per ontwikkelpad, met per
 * rol de "aantallen nodig" per wereld) en zet dat om in vlootschouw_planning-
 * rijen (nodig_nu).
 *
 * Gebruik: node scripts/import-strategische-planning.mjs "<pad-naar-excel.xlsx>" "<jouw-email>" [--dry-run]
 *
 * Vereist DATABASE_URL in .env.local. Doet alleen upserts op nodig_nu (laat
 * nodig_straks met rust); raakt gesprekken/gesprek_paden niet aan.
 */
import { readFileSync } from "node:fs";
import { Client } from "@neondatabase/serverless";
import { XMLParser } from "fast-xml-parser";
import JSZip from "jszip";

const PADEN = {
  vakexpert: {
    rol: "A",
    werelden: { Food: "B", RA: "C", NF: "D" },
    rollen: [
      "Consultant",
      "Deskundige",
      "Vakdeskundige",
      "Inhoudsdeskundige",
      "Visionair",
    ],
  },
  adviseur: {
    rol: "I",
    werelden: { Food: "J", RA: "K", NF: "L" },
    rollen: [
      "Consultant",
      "Commercieel onverdachte consultant",
      "Consultant & hunter",
      "Accountmanager",
      "Strategisch accountmanager",
    ],
  },
  leider: {
    rol: "Q",
    werelden: { Food: "R", RA: "S", NF: "T" },
    rollen: [
      "Consultant",
      "Buddy/ sparringspartner",
      "Projectleider",
      "Business manager/ senior PL",
      "MT-lid",
    ],
  },
  trainer: {
    rol: "Y",
    werelden: { Food: "Z", RA: "AA", NF: "AB" },
    rollen: [], // geen naam-match mogelijk; niveau volgt uit het cijfer in het label ("Trainer 3" -> 3)
  },
};

const WERELD_MAP = { Food: "QA", RA: "RA", NF: "NF" };
const DATA_RIJEN = [7, 8, 9, 10, 11];

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

function bepaalNiveau(padId, rolLabel) {
  const genormaliseerd = rolLabel.trim();
  const index = PADEN[padId].rollen.findIndex(
    (r) => r.toLowerCase() === genormaliseerd.toLowerCase(),
  );
  if (index !== -1) return index + 1;

  const cijferMatch = genormaliseerd.match(/(\d+)\s*$/);
  if (cijferMatch) return Number.parseInt(cijferMatch[1], 10);

  return null;
}

async function parseStrategischePlanningSheet(filePath) {
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
  const sheet = sheets.find(
    (s) => s["@_name"] === "Strategische personeelsplanning",
  );
  if (!sheet)
    throw new Error('Tabblad "Strategische personeelsplanning" niet gevonden');

  const rels = parser.parse(
    await zip.file("xl/_rels/workbook.xml.rels").async("string"),
  );
  let relArr = rels.Relationships.Relationship;
  if (!Array.isArray(relArr)) relArr = [relArr];
  const relMap = Object.fromEntries(
    relArr.map((r) => [r["@_Id"], r["@_Target"]]),
  );
  const target = relMap[sheet["@_r:id"]];
  const sheetPath = `xl/${target.replace(/^\/?xl\//, "")}`;

  const sheetXml = await zip.file(sheetPath).async("string");
  const sheetData = parser.parse(sheetXml);
  let rows = sheetData.worksheet.sheetData.row;
  if (!Array.isArray(rows)) rows = [rows];

  const waardenPerRij = new Map();
  for (const row of rows) {
    const rowNum = Number(row["@_r"]);
    if (!DATA_RIJEN.includes(rowNum)) continue;

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
    waardenPerRij.set(rowNum, waarden);
  }

  const resultaten = [];
  const problemen = [];

  for (const [padId, config] of Object.entries(PADEN)) {
    for (const rowNum of DATA_RIJEN) {
      const waarden = waardenPerRij.get(rowNum);
      if (!waarden) continue;

      const rolLabel = String(waarden[config.rol] ?? "").trim();
      if (!rolLabel) continue;

      const niveau = bepaalNiveau(padId, rolLabel);
      if (niveau === null || niveau < 1 || niveau > 5) {
        problemen.push(
          `${padId} rij ${rowNum}: kon niveau niet bepalen uit rol "${rolLabel}"`,
        );
        continue;
      }

      for (const [excelWereld, kolom] of Object.entries(config.werelden)) {
        const raw = waarden[kolom];
        const nodigNu = Number.parseInt(String(raw ?? ""), 10);
        resultaten.push({
          padId,
          niveau,
          wereld: WERELD_MAP[excelWereld],
          rolLabel,
          nodigNu: Number.isInteger(nodigNu) && nodigNu >= 0 ? nodigNu : 0,
        });
      }
    }
  }

  return { resultaten, problemen };
}

async function main() {
  const [, , excelPad, importerEmail, vlag] = process.argv;
  if (!excelPad || !importerEmail) {
    console.error(
      'Gebruik: node scripts/import-strategische-planning.mjs "<pad-naar-excel.xlsx>" "<jouw-email>" [--dry-run]',
    );
    process.exit(1);
  }

  const { resultaten, problemen } =
    await parseStrategischePlanningSheet(excelPad);
  console.log(`${resultaten.length} (pad, niveau, wereld)-cellen gevonden.`);
  if (problemen.length > 0) {
    console.log("Let op, niet herkend:");
    for (const p of problemen) console.log(` - ${p}`);
  }

  if (vlag === "--dry-run") {
    console.log("Dry run — geen database-schrijfacties.");
    console.table(
      resultaten.map(({ rolLabel, ...r }) => ({ ...r, rol: rolLabel })),
    );
    return;
  }

  const client = new Client(loadDatabaseUrl());
  await client.connect();
  try {
    for (const r of resultaten) {
      await client.query(
        `INSERT INTO vlootschouw_planning (pad_id, niveau, wereld, nodig_nu, nodig_straks, updated_by)
         VALUES ($1, $2, $3, $4, 0, $5)
         ON CONFLICT (pad_id, niveau, wereld) DO UPDATE SET
           nodig_nu = EXCLUDED.nodig_nu,
           updated_by = EXCLUDED.updated_by,
           updated_at = now()`,
        [r.padId, r.niveau, r.wereld, r.nodigNu, importerEmail],
      );
    }
    console.log(
      `${resultaten.length} cellen weggeschreven naar vlootschouw_planning.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
