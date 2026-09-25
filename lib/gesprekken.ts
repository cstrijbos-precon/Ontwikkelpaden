import { buildNextCycleState } from "@/lib/cycle-carry-over";
import { sql } from "@/lib/db";
import { effectieveNiveaus } from "@/lib/effectief-niveau";
import {
  clampPadNiveau,
  clampScore,
  enforceDateOrNull,
  formatDateFromDb,
} from "@/lib/field-format";
import type { BeoordelaarStatus } from "@/lib/gesprekken-access";
import { canAccessGesprek } from "@/lib/gesprekken-access";
import {
  beantwoordHoofdbeoordelaarKoppeling,
  haalHoofdbeoordelaarKoppeling,
  haalMedewerkersVoorHoofdbeoordelaar,
  haalWachtendeHoofdbeoordelaar,
  isStandingHoofdbeoordelaar,
  stelHoofdbeoordelaarVoor,
  stelHoofdbeoordelaarVoorDirect,
} from "@/lib/hoofdbeoordelaar-koppeling";
import { createInitialState, mergeWithInitialState } from "@/lib/initial-state";
import {
  bepaalNieuweOndertekeningen,
  mailOndertekenaars,
} from "@/lib/ondertekeningmail";
import { domeinIsToegestaan } from "@/lib/registratie";
import type {
  BekendeMedewerker,
  BeoordelaarRol,
  DashboardOverzicht,
  Gesprek,
  GesprekListItem,
  GesprekStatus,
} from "@/types/gesprekken";
import type {
  CompId,
  OntwikkelpadenState,
  PadId,
} from "@/types/ontwikkelpaden";

const COMP_IDS: CompId[] = ["b", "k", "o", "org", "t"];
const PAD_IDS: PadId[] = ["vakexpert", "adviseur", "leider", "trainer"];

interface GesprekListRow {
  id: string;
  medewerker_naam: string;
  medewerker_email: string | null;
  gesprek_datum: string | null;
  status: GesprekStatus;
  hoofdbeoordelaar: string;
  hoofdbeoordelaar_status: BeoordelaarStatus;
  medebeoordelaar: string;
  medebeoordelaar_status: BeoordelaarStatus;
  updated_at: string;
}

interface GesprekRow {
  id: string;
  medewerker_naam: string;
  medewerker_email: string | null;
  wereld: string;
  bij_precon_sinds: string;
  gesprek_datum: unknown;
  datum_vorig: unknown;
  datum_volgend: unknown;
  hoofdbeoordelaar: string;
  hoofdbeoordelaar_status: BeoordelaarStatus;
  medebeoordelaar: string;
  medebeoordelaar_status: BeoordelaarStatus;
  status: GesprekStatus;
  state: OntwikkelpadenState;
  previous_gesprek_id: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  toegang_geweigerd: { email: string; op: string }[];
}

function mapListRow(row: GesprekListRow): GesprekListItem {
  return {
    id: row.id,
    medewerkerNaam: row.medewerker_naam,
    medewerkerEmail: row.medewerker_email,
    gesprekDatum: formatDateFromDb(row.gesprek_datum),
    status: row.status,
    hoofdbeoordelaar: row.hoofdbeoordelaar,
    hoofdbeoordelaarStatus: row.hoofdbeoordelaar_status,
    medebeoordelaar: row.medebeoordelaar,
    medebeoordelaarStatus: row.medebeoordelaar_status,
    updatedAt: row.updated_at,
  };
}

function metadataFromState(state: OntwikkelpadenState) {
  return {
    medewerkerNaam: state.naam,
    wereld: state.wereld,
    bijPreconSinds: state.bijPreconSinds,
    gesprekDatum: enforceDateOrNull(state.datum),
    datumVorig: enforceDateOrNull(state.datumVorig),
    datumVolgend: enforceDateOrNull(state.datumVolgend),
    hoofdbeoordelaar: state.hoofdbeoordelaar,
    medebeoordelaar: state.medebeoordelaar,
  };
}

function mapRow(row: GesprekRow): Gesprek {
  return {
    id: row.id,
    medewerkerNaam: row.medewerker_naam,
    medewerkerEmail: row.medewerker_email,
    wereld: row.wereld,
    bijPreconSinds: row.bij_precon_sinds,
    gesprekDatum: formatDateFromDb(row.gesprek_datum),
    datumVorig: formatDateFromDb(row.datum_vorig),
    datumVolgend: formatDateFromDb(row.datum_volgend),
    hoofdbeoordelaar: row.hoofdbeoordelaar,
    hoofdbeoordelaarStatus: row.hoofdbeoordelaar_status,
    medebeoordelaar: row.medebeoordelaar,
    medebeoordelaarStatus: row.medebeoordelaar_status,
    status: row.status,
    state: row.state,
    previousGesprekId: row.previous_gesprek_id,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    toegangGeweigerdVoor: (row.toegang_geweigerd ?? []).map((t) =>
      t.email.toLowerCase(),
    ),
  };
}

async function syncExtractTables(
  gesprekId: string,
  state: OntwikkelpadenState,
): Promise<void> {
  for (const compId of COMP_IDS) {
    await sql`
      INSERT INTO gesprek_competenties (gesprek_id, comp_id, score, opmerking)
      VALUES (${gesprekId}, ${compId}, ${clampScore(state.scores[compId])}, ${state.opmerkingen[compId]})
      ON CONFLICT (gesprek_id, comp_id) DO UPDATE SET
        score = EXCLUDED.score,
        opmerking = EXCLUDED.opmerking
    `;
  }

  const huidigeNiveaus = effectieveNiveaus(state);
  for (const padId of PAD_IDS) {
    await sql`
      INSERT INTO gesprek_paden (
        gesprek_id, pad_id, vorig_jaar_niveau, ambitie, trainingsgroep_id, huidig_niveau
      ) VALUES (
        ${gesprekId},
        ${padId},
        ${clampPadNiveau(state.vorigJaar[padId])},
        ${state.ambities[padId]},
        ${state.trainingsgroepen[padId]},
        ${huidigeNiveaus[padId]}
      )
      ON CONFLICT (gesprek_id, pad_id) DO UPDATE SET
        vorig_jaar_niveau = EXCLUDED.vorig_jaar_niveau,
        ambitie = EXCLUDED.ambitie,
        trainingsgroep_id = EXCLUDED.trainingsgroep_id,
        huidig_niveau = EXCLUDED.huidig_niveau
    `;
  }
}

export async function listGesprekken(
  userEmail: string,
  isAdmin: boolean,
): Promise<GesprekListItem[]> {
  const rows = (
    isAdmin
      ? await sql`
        SELECT id, medewerker_naam, medewerker_email, gesprek_datum, status,
               hoofdbeoordelaar, hoofdbeoordelaar_status,
               medebeoordelaar, medebeoordelaar_status, updated_at
        FROM gesprekken
        ORDER BY updated_at DESC
      `
      : await sql`
        WITH cyclus AS (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY LOWER(medewerker_email)
            ORDER BY created_at DESC
          ) AS rn
          FROM gesprekken
          WHERE medewerker_email IS NOT NULL
        )
        SELECT g.id, g.medewerker_naam, g.medewerker_email, g.gesprek_datum, g.status,
               g.hoofdbeoordelaar, g.hoofdbeoordelaar_status,
               g.medebeoordelaar, g.medebeoordelaar_status, g.updated_at
        FROM gesprekken g
        LEFT JOIN cyclus c ON c.id = g.id
        WHERE (
             LOWER(g.created_by) = LOWER(${userEmail})
             AND NOT EXISTS (
               SELECT 1 FROM jsonb_array_elements(g.toegang_geweigerd) AS tg
               WHERE LOWER(tg->>'email') = LOWER(${userEmail})
             )
           )
           OR LOWER(g.medewerker_email) = LOWER(${userEmail})
           OR (
             LOWER(g.hoofdbeoordelaar) = LOWER(${userEmail})
             AND g.hoofdbeoordelaar_status = 'toegestaan'
           )
           OR (
             LOWER(g.medebeoordelaar) = LOWER(${userEmail})
             AND g.medebeoordelaar_status = 'toegestaan'
           )
           OR (
             -- Doorlopende hoofdbeoordelaar: alleen het huidige en het direct
             -- voorgaande gesprek (rn 1 en 2), niet de hele historie. Oudere
             -- verslagen vraag je op bij HR.
             LOWER(g.medewerker_email) IN (
               SELECT LOWER(medewerker_email) FROM hoofdbeoordelaar_koppelingen
               WHERE LOWER(hoofdbeoordelaar_email) = LOWER(${userEmail})
                 AND status = 'toegestaan'
             )
             AND c.rn <= 2
           )
        ORDER BY g.updated_at DESC
      `
  ) as GesprekListRow[];

  return rows.map(mapListRow);
}

/**
 * Of `gesprekId` het huidige of het direct voorgaande gesprek is van
 * `medewerkerEmail` — de twee meest recente, op aanmaakdatum. Bepaalt hoever
 * een doorlopende hoofdbeoordelaar-koppeling terugkijkt; zie
 * isStandingHoofdbeoordelaar in lib/hoofdbeoordelaar-koppeling.ts.
 */
async function isBinnenStandingBereik(
  gesprekId: string,
  medewerkerEmail: string | null,
): Promise<boolean> {
  if (!medewerkerEmail) return false;
  const rows = (await sql`
    SELECT id FROM gesprekken
    WHERE LOWER(medewerker_email) = LOWER(${medewerkerEmail})
    ORDER BY created_at DESC
    LIMIT 2
  `) as { id: string }[];
  return rows.some((r) => r.id === gesprekId);
}

export async function getGesprekById(
  id: string,
  userEmail: string,
  isAdmin: boolean,
): Promise<Gesprek | null> {
  const rows = (await sql`
    SELECT * FROM gesprekken WHERE id = ${id}
  `) as GesprekRow[];
  const row = rows[0];
  if (!row) return null;

  const gesprek = mapRow(row);
  const toegang =
    canAccessGesprek(
      {
        createdBy: gesprek.createdBy,
        medewerkerEmail: gesprek.medewerkerEmail,
        hoofdbeoordelaar: gesprek.hoofdbeoordelaar,
        hoofdbeoordelaarStatus: gesprek.hoofdbeoordelaarStatus,
        medebeoordelaar: gesprek.medebeoordelaar,
        medebeoordelaarStatus: gesprek.medebeoordelaarStatus,
        toegangGeweigerdVoor: gesprek.toegangGeweigerdVoor,
      },
      userEmail,
      isAdmin,
    ) ||
    // Een doorlopende hoofdbeoordelaar-koppeling geeft toegang tot het
    // huidige en het direct voorgaande gesprek van die medewerker, ook als
    // dat gesprek zelf geen hoofdbeoordelaar heeft ingevuld. Oudere jaren
    // vallen hier bewust buiten — die vraag je op bij HR.
    ((await isStandingHoofdbeoordelaar(gesprek.medewerkerEmail, userEmail)) &&
      (await isBinnenStandingBereik(gesprek.id, gesprek.medewerkerEmail)));

  if (!toegang) {
    // Onderscheid alleen dit ene geval met een duidelijke melding: iemand die
    // het gesprek aanmaakte, maar expliciet is afgewezen als beoordelaar. Voor
    // ieder ander zonder toegang blijft het antwoord een gewone lege uitslag —
    // anders zou deze melding zelf al verraden dat het gesprek bestaat.
    const email = userEmail.toLowerCase();
    const afgewezenAlsAanmaker =
      !isAdmin &&
      gesprek.createdBy.toLowerCase() === email &&
      gesprek.toegangGeweigerdVoor.includes(email);
    if (afgewezenAlsAanmaker) throw new ToegangGeweigerdError();
    return null;
  }

  return gesprek;
}

export async function createGesprek(
  userEmail: string,
  stateInput?: OntwikkelpadenState,
  medewerkerEmail?: string,
  previousGesprekId?: string,
  status: GesprekStatus = "draft",
): Promise<Gesprek> {
  const state = stateInput
    ? mergeWithInitialState(stateInput)
    : createInitialState();
  const meta = metadataFromState(state);

  const rows = (await sql`
    INSERT INTO gesprekken (
      medewerker_naam, medewerker_email, wereld, bij_precon_sinds,
      gesprek_datum, datum_vorig, datum_volgend,
      hoofdbeoordelaar, medebeoordelaar, state, previous_gesprek_id,
      created_by, updated_by, status
    ) VALUES (
      ${meta.medewerkerNaam},
      ${medewerkerEmail ?? null},
      ${meta.wereld},
      ${meta.bijPreconSinds},
      ${meta.gesprekDatum},
      ${meta.datumVorig},
      ${meta.datumVolgend},
      ${meta.hoofdbeoordelaar},
      ${meta.medebeoordelaar},
      ${state},
      ${previousGesprekId ?? null},
      ${userEmail},
      ${userEmail},
      ${status}
    )
    RETURNING *
  `) as GesprekRow[];

  const row = rows[0];
  if (!row) throw new Error("Failed to create gesprek");

  const gesprek = mapRow(row);
  await syncExtractTables(gesprek.id, state);
  return gesprek;
}

export async function updateGesprek(
  id: string,
  userEmail: string,
  isAdmin: boolean,
  state: OntwikkelpadenState,
  status?: GesprekStatus,
  medewerkerEmail?: string | null,
): Promise<Gesprek | null> {
  const existing = await getGesprekById(id, userEmail, isAdmin);
  if (!existing) return null;

  const cleanState = mergeWithInitialState(state);
  const meta = metadataFromState(cleanState);
  const nextStatus = status ?? existing.status;
  const nextMedewerkerEmail =
    medewerkerEmail !== undefined ? medewerkerEmail : existing.medewerkerEmail;

  /**
   * Een beoordelaar die zichzelf toevoegt via het dashboard loopt niet via deze
   * functie (zie requestBeoordelaarKoppeling) en zet status op 'in_afwachting'.
   * Als de medewerker hier zelf een ANDER adres invult, is dat een bewuste
   * eigen keuze en dus meteen toegestaan. Blijft het adres ongewijzigd (bv.
   * de periodieke autosave), dan laten we een eventuele 'in_afwachting'-status
   * met rust — anders zou de goedkeuringseis stilzwijgend omzeild worden.
   *
   * Alleen de medewerker zelf (of een beheerder) mag dit veld op deze manier
   * veranderen. Iedereen die verder toegang heeft tot het gesprek — ook een
   * medebeoordelaar, ook iemand die zelf nog op goedkeuring wacht — kan hier
   * anders zichzelf of wie dan ook als hoofdbeoordelaar instellen en dat laten
   * doorgaan voor de eigen keuze van de medewerker. Verandert zo iemand het
   * veld toch, dan wordt die wijziging simpelweg niet opgeslagen.
   */
  const magBeoordelaarsZelfKiezen =
    isAdmin ||
    userEmail.toLowerCase() === (existing.medewerkerEmail || "").toLowerCase();

  const hoofdbeoordelaarGewijzigd =
    magBeoordelaarsZelfKiezen &&
    meta.hoofdbeoordelaar.trim().toLowerCase() !==
      (existing.hoofdbeoordelaar || "").trim().toLowerCase();
  const nextHoofdbeoordelaar = magBeoordelaarsZelfKiezen
    ? meta.hoofdbeoordelaar
    : existing.hoofdbeoordelaar;
  const nextHoofdbeoordelaarStatus = hoofdbeoordelaarGewijzigd
    ? "toegestaan"
    : existing.hoofdbeoordelaarStatus;
  const medebeoordelaarGewijzigd =
    magBeoordelaarsZelfKiezen &&
    meta.medebeoordelaar.trim().toLowerCase() !==
      (existing.medebeoordelaar || "").trim().toLowerCase();
  const nextMedebeoordelaar = magBeoordelaarsZelfKiezen
    ? meta.medebeoordelaar
    : existing.medebeoordelaar;
  const nextMedebeoordelaarStatus = medebeoordelaarGewijzigd
    ? "toegestaan"
    : existing.medebeoordelaarStatus;

  // Het formulier leest de beoordelaars uit state, niet uit de kolom — een
  // geweigerde wijziging moet dus ook uit de opgeslagen state verdwijnen,
  // anders blijft die na een refresh alsnog zichtbaar staan.
  cleanState.hoofdbeoordelaar = nextHoofdbeoordelaar;
  cleanState.medebeoordelaar = nextMedebeoordelaar;

  const rows = (await sql`
    UPDATE gesprekken SET
      medewerker_naam = ${meta.medewerkerNaam},
      medewerker_email = ${nextMedewerkerEmail},
      wereld = ${meta.wereld},
      bij_precon_sinds = ${meta.bijPreconSinds},
      gesprek_datum = ${meta.gesprekDatum},
      datum_vorig = ${meta.datumVorig},
      datum_volgend = ${meta.datumVolgend},
      hoofdbeoordelaar = ${nextHoofdbeoordelaar},
      hoofdbeoordelaar_status = ${nextHoofdbeoordelaarStatus},
      medebeoordelaar = ${nextMedebeoordelaar},
      medebeoordelaar_status = ${nextMedebeoordelaarStatus},
      status = ${nextStatus},
      state = ${cleanState},
      updated_by = ${userEmail},
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `) as GesprekRow[];

  const row = rows[0];
  if (!row) return null;

  const gesprek = mapRow(row);
  await syncExtractTables(gesprek.id, cleanState);

  // Vult de medewerker zelf een hoofdbeoordelaar in, dan is dat een bewuste
  // eigen keuze (zie boven) — en geldt meteen voor al zijn of haar werk, niet
  // alleen dit ene gesprek.
  if (
    hoofdbeoordelaarGewijzigd &&
    meta.hoofdbeoordelaar.trim() &&
    gesprek.medewerkerEmail
  ) {
    await stelHoofdbeoordelaarVoorDirect(
      gesprek.medewerkerEmail,
      meta.hoofdbeoordelaar.trim(),
    );
  }

  // Elke handtekening die er hier bij komt, mailt de nog openstaande rollen —
  // niet alleen de eerstvolgende, iedereen die nog moet tekenen.
  for (const rol of bepaalNieuweOndertekeningen(existing.state, cleanState)) {
    await mailOndertekenaars(gesprek, rol);
  }

  return gesprek;
}

export class GesprekNotCompletedError extends Error {
  constructor() {
    super("Gesprek is nog niet afgerond");
    this.name = "GesprekNotCompletedError";
  }
}

/**
 * Archiveert een afgerond gesprek en start de volgende jaarcyclus: sterren,
 * T-profiel-framework en stamgegevens gaan mee, tekstvelden en akkoord starten leeg.
 */
export async function startNewCycle(
  id: string,
  userEmail: string,
  isAdmin: boolean,
): Promise<Gesprek | null> {
  const existing = await getGesprekById(id, userEmail, isAdmin);
  if (!existing) return null;
  if (existing.status !== "completed") {
    throw new GesprekNotCompletedError();
  }

  await updateGesprek(id, userEmail, isAdmin, existing.state, "archived");

  return createGesprek(
    userEmail,
    buildNextCycleState(existing.state),
    existing.medewerkerEmail ?? undefined,
    existing.id,
  );
}

export class BeoordelaarAlGekoppeldError extends Error {
  constructor() {
    super("Er is al iemand als beoordelaar gekoppeld voor deze rol");
    this.name = "BeoordelaarAlGekoppeldError";
  }
}

export class MedewerkerNietGevondenError extends Error {
  constructor() {
    super(
      "Geen eigen gesprek gevonden voor deze medewerker — diegene moet eerst zelf een keer inloggen en het eigen gesprek openen",
    );
    this.name = "MedewerkerNietGevondenError";
  }
}

export class GeenToegangError extends Error {
  constructor() {
    super(
      "Alleen de medewerker zelf (of een beheerder) mag dit goedkeuren of afwijzen",
    );
    this.name = "GeenToegangError";
  }
}

export class ToegangGeweigerdError extends Error {
  constructor() {
    super("Toegang tot dit gesprek is geweigerd door de medewerker");
    this.name = "ToegangGeweigerdError";
  }
}

/** Naam+e-mail van iedereen die ooit een eigen gesprek heeft geopend — voor de beoordelaar-dropdown. */
export async function getBekendeMedewerkers(): Promise<BekendeMedewerker[]> {
  const rows = (await sql`
    SELECT DISTINCT ON (medewerker_email) medewerker_naam, medewerker_email
    FROM gesprekken
    WHERE medewerker_email IS NOT NULL AND medewerker_naam <> ''
    ORDER BY medewerker_email, updated_at DESC
  `) as { medewerker_naam: string; medewerker_email: string }[];

  return rows
    .map((row) => ({ naam: row.medewerker_naam, email: row.medewerker_email }))
    .sort((a, b) => a.naam.localeCompare(b.naam));
}

/** Gesprekken van deze medewerker met een openstaand koppelingsverzoek (voor de pop-up bij inloggen). */
export async function getPendingGoedkeuringen(
  userEmail: string,
): Promise<GesprekListItem[]> {
  const rows = (await sql`
    SELECT id, medewerker_naam, medewerker_email, gesprek_datum, status,
           hoofdbeoordelaar, hoofdbeoordelaar_status,
           medebeoordelaar, medebeoordelaar_status, updated_at
    FROM gesprekken
    WHERE LOWER(medewerker_email) = LOWER(${userEmail})
      AND (hoofdbeoordelaar_status = 'in_afwachting' OR medebeoordelaar_status = 'in_afwachting')
    ORDER BY updated_at DESC
  `) as GesprekListRow[];

  return rows.map(mapListRow);
}

/** De drie rubrieken voor het persoonlijke dashboard. */
export async function getDashboardOverzicht(
  userEmail: string,
  isAdmin: boolean,
): Promise<DashboardOverzicht> {
  const alle = await listGesprekken(userEmail, isAdmin);
  const email = userEmail.toLowerCase();
  const eigenMedewerkers = new Set(
    (await haalMedewerkersVoorHoofdbeoordelaar(userEmail)).map((e) =>
      e.toLowerCase(),
    ),
  );

  const eigen = alle.filter((g) => g.medewerkerEmail?.toLowerCase() === email);
  const alsHoofdbeoordelaar = alle.filter(
    (g) =>
      g.hoofdbeoordelaar.trim().toLowerCase() === email ||
      (g.medewerkerEmail &&
        eigenMedewerkers.has(g.medewerkerEmail.toLowerCase())),
  );
  const alsMedebeoordelaar = alle.filter(
    (g) => g.medebeoordelaar.trim().toLowerCase() === email,
  );
  const pendingGoedkeuringen = await getPendingGoedkeuringen(userEmail);
  const wachtendeHoofdbeoordelaar =
    await haalWachtendeHoofdbeoordelaar(userEmail);

  return {
    eigen,
    alsHoofdbeoordelaar,
    alsMedebeoordelaar,
    pendingGoedkeuringen,
    pendingHoofdbeoordelaar:
      wachtendeHoofdbeoordelaar?.hoofdbeoordelaarEmail ?? null,
  };
}

/**
 * Een beoordelaar koppelt zichzelf aan een medewerker (via de naam-dropdown op
 * het dashboard). Bewust zonder toegangscheck om de aanvraag te starten —
 * maar de koppeling zelf geeft pas toegang zodra de medewerker akkoord geeft
 * (zie canAccessGesprek); tot die tijd staat er alleen een aanvraag klaar.
 *
 * Heeft de medewerker nog geen enkel gesprek, dan start deze actie er meteen
 * een als concept; wie 'm aanmaakt blijft daar via created_by toegang tot
 * houden, dus wachten op goedkeuring blokkeert niemand.
 *
 * Heeft de medewerker nog geen account, dan blijft de koppeling gewoon
 * 'in_afwachting' tot die collega voor het eerst inlogt — dan ziet diegene
 * dezelfde goedkeuringsvraag als ieder ander.
 */
export async function requestBeoordelaarKoppeling(
  medewerkerEmail: string,
  rol: BeoordelaarRol,
  beoordelaarEmail: string,
): Promise<Gesprek> {
  const rows = (await sql`
    SELECT * FROM gesprekken
    WHERE LOWER(medewerker_email) = LOWER(${medewerkerEmail})
    ORDER BY updated_at DESC
    LIMIT 1
  `) as GesprekRow[];
  const row = rows[0];

  // Een typefout mag geen gesprek opleveren op een adres dat nooit kan
  // inloggen. Het domein is nu de grens, niet het bestaan van een account.
  if (!row && !domeinIsToegestaan(medewerkerEmail)) {
    throw new MedewerkerNietGevondenError();
  }

  const nieuweStatus: BeoordelaarStatus = "in_afwachting";

  const existing = row
    ? mapRow(row)
    : await createGesprek(beoordelaarEmail, undefined, medewerkerEmail);
  const huidigeWaarde =
    rol === "hoofdbeoordelaar"
      ? existing.hoofdbeoordelaar
      : existing.medebeoordelaar;
  if (huidigeWaarde.trim() !== "") throw new BeoordelaarAlGekoppeldError();

  /**
   * De kolom én het state-veld moeten mee. Het formulier op scherm Gegevens
   * leest de beoordelaars uit `state`; bleef die leeg, dan schreef de
   * eerstvolgende autosave die leegte terug over de kolom en was de koppeling
   * stilzwijgend weg.
   */
  const updated = (
    rol === "hoofdbeoordelaar"
      ? await sql`
        UPDATE gesprekken SET
          hoofdbeoordelaar = ${beoordelaarEmail},
          hoofdbeoordelaar_status = ${nieuweStatus},
          state = jsonb_set(state, '{hoofdbeoordelaar}', to_jsonb(${beoordelaarEmail}::text))
        WHERE id = ${existing.id}
        RETURNING *
      `
      : await sql`
        UPDATE gesprekken SET
          medebeoordelaar = ${beoordelaarEmail},
          medebeoordelaar_status = ${nieuweStatus},
          state = jsonb_set(state, '{medebeoordelaar}', to_jsonb(${beoordelaarEmail}::text))
        WHERE id = ${existing.id}
        RETURNING *
      `
  ) as GesprekRow[];

  const updatedRow = updated[0];
  if (!updatedRow) throw new Error("Koppelen mislukt");

  // Een hoofdbeoordelaar krijgt hiermee ook een doorlopende koppeling: niet
  // alleen dit ene gesprek, maar al het werk van deze medewerker, nu en
  // volgend jaar. Medebeoordelaar blijft beperkt tot dit ene gesprek.
  if (rol === "hoofdbeoordelaar") {
    await stelHoofdbeoordelaarVoor(
      medewerkerEmail,
      beoordelaarEmail,
      beoordelaarEmail,
    );
  }

  return mapRow(updatedRow);
}

/** De medewerker zelf (of een beheerder) keurt een koppelingsverzoek goed of wijst het af. */
export async function respondBeoordelaarKoppeling(
  gesprekId: string,
  userEmail: string,
  isAdmin: boolean,
  rol: BeoordelaarRol,
  actie: "goedkeuren" | "afwijzen",
): Promise<Gesprek | null> {
  const existing = await getGesprekById(gesprekId, userEmail, isAdmin);
  if (!existing) return null;

  const isMedewerker =
    existing.medewerkerEmail?.toLowerCase() === userEmail.toLowerCase();
  if (!isAdmin && !isMedewerker) {
    throw new GeenToegangError();
  }

  const rows = (
    actie === "goedkeuren"
      ? rol === "hoofdbeoordelaar"
        ? await sql`
          UPDATE gesprekken SET hoofdbeoordelaar_status = 'toegestaan'
          WHERE id = ${gesprekId} RETURNING *
        `
        : await sql`
          UPDATE gesprekken SET medebeoordelaar_status = 'toegestaan'
          WHERE id = ${gesprekId} RETURNING *
        `
      : rol === "hoofdbeoordelaar"
        ? await sql`
          UPDATE gesprekken SET
            hoofdbeoordelaar = '',
            hoofdbeoordelaar_status = 'toegestaan',
            state = jsonb_set(state, '{hoofdbeoordelaar}', '""'::jsonb),
            toegang_geweigerd = CASE WHEN hoofdbeoordelaar <> '' THEN
              toegang_geweigerd || jsonb_build_array(
                jsonb_build_object('email', LOWER(hoofdbeoordelaar), 'op', now())
              )
              ELSE toegang_geweigerd END
          WHERE id = ${gesprekId} RETURNING *
        `
        : await sql`
          UPDATE gesprekken SET
            medebeoordelaar = '',
            medebeoordelaar_status = 'toegestaan',
            state = jsonb_set(state, '{medebeoordelaar}', '""'::jsonb),
            toegang_geweigerd = CASE WHEN medebeoordelaar <> '' THEN
              toegang_geweigerd || jsonb_build_array(
                jsonb_build_object('email', LOWER(medebeoordelaar), 'op', now())
              )
              ELSE toegang_geweigerd END
          WHERE id = ${gesprekId} RETURNING *
        `
  ) as GesprekRow[];

  const row = rows[0];
  if (!row) return null;

  // De doorlopende koppeling volgt hetzelfde besluit: goedkeuren geldt voor
  // al het werk van deze medewerker, afwijzen trekt die toegang weer in.
  if (rol === "hoofdbeoordelaar" && existing.medewerkerEmail) {
    await beantwoordHoofdbeoordelaarKoppeling(existing.medewerkerEmail, actie);
    await syncGesprekkenMetHoofdbeoordelaarBesluit(
      existing.medewerkerEmail,
      row.hoofdbeoordelaar || existing.hoofdbeoordelaar,
      actie,
    );
  }

  return mapRow(row);
}

/**
 * Houdt de badge/status op elk los gesprek gelijk met het besluit over de
 * doorlopende hoofdbeoordelaar-koppeling. Zonder dit kon een medewerker via
 * de ene weg goedkeuren (het losse gesprek, of de doorlopende vraag) en bleef
 * de andere kant 'in afwachting' tonen — of erger: bij afwijzen bleef een
 * los gesprek de afgewezen naam gewoon nog in de kolom hebben staan, met
 * onvoorwaardelijke toegang tot gevolg (canAccessGesprek kijkt niet naar de
 * status, alleen naar de naam in de kolom).
 */
async function syncGesprekkenMetHoofdbeoordelaarBesluit(
  medewerkerEmail: string,
  hoofdbeoordelaarEmail: string,
  actie: "goedkeuren" | "afwijzen",
): Promise<void> {
  if (actie === "goedkeuren") {
    await sql`
      UPDATE gesprekken SET hoofdbeoordelaar_status = 'toegestaan'
      WHERE LOWER(medewerker_email) = LOWER(${medewerkerEmail})
    `;
    return;
  }

  await sql`
    UPDATE gesprekken SET
      hoofdbeoordelaar = '',
      hoofdbeoordelaar_status = 'toegestaan',
      state = jsonb_set(state, '{hoofdbeoordelaar}', '""'::jsonb),
      toegang_geweigerd = toegang_geweigerd || jsonb_build_array(
        jsonb_build_object('email', LOWER(hoofdbeoordelaar), 'op', now())
      )
    WHERE LOWER(medewerker_email) = LOWER(${medewerkerEmail})
      AND LOWER(hoofdbeoordelaar) = LOWER(${hoofdbeoordelaarEmail})
  `;
}

/**
 * De medewerker beantwoordt de vraag "mag deze persoon al je verslagen
 * inzien?" — de doorlopende koppeling, los van welk gesprek de aanvraag deed
 * ontstaan.
 */
export async function respondStandingHoofdbeoordelaar(
  userEmail: string,
  actie: "goedkeuren" | "afwijzen",
): Promise<void> {
  const koppeling = await haalHoofdbeoordelaarKoppeling(userEmail);
  if (!koppeling) return;

  await beantwoordHoofdbeoordelaarKoppeling(userEmail, actie);
  await syncGesprekkenMetHoofdbeoordelaarBesluit(
    userEmail,
    koppeling.hoofdbeoordelaarEmail,
    actie,
  );
}
