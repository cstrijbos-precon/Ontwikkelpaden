import { findUserByEmail } from "@/lib/auth-users";
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
import { createInitialState, mergeWithInitialState } from "@/lib/initial-state";
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
        SELECT id, medewerker_naam, medewerker_email, gesprek_datum, status,
               hoofdbeoordelaar, hoofdbeoordelaar_status,
               medebeoordelaar, medebeoordelaar_status, updated_at
        FROM gesprekken
        WHERE created_by = ${userEmail}
           OR LOWER(medewerker_email) = LOWER(${userEmail})
           OR LOWER(hoofdbeoordelaar) = LOWER(${userEmail})
           OR LOWER(medebeoordelaar) = LOWER(${userEmail})
        ORDER BY updated_at DESC
      `
  ) as GesprekListRow[];

  return rows.map(mapListRow);
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
  if (
    !canAccessGesprek(
      {
        createdBy: gesprek.createdBy,
        medewerkerEmail: gesprek.medewerkerEmail,
        hoofdbeoordelaar: gesprek.hoofdbeoordelaar,
        hoofdbeoordelaarStatus: gesprek.hoofdbeoordelaarStatus,
        medebeoordelaar: gesprek.medebeoordelaar,
        medebeoordelaarStatus: gesprek.medebeoordelaarStatus,
      },
      userEmail,
      isAdmin,
    )
  ) {
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
   */
  const hoofdbeoordelaarGewijzigd =
    meta.hoofdbeoordelaar.trim().toLowerCase() !==
    (existing.hoofdbeoordelaar || "").trim().toLowerCase();
  const nextHoofdbeoordelaarStatus = hoofdbeoordelaarGewijzigd
    ? "toegestaan"
    : existing.hoofdbeoordelaarStatus;
  const medebeoordelaarGewijzigd =
    meta.medebeoordelaar.trim().toLowerCase() !==
    (existing.medebeoordelaar || "").trim().toLowerCase();
  const nextMedebeoordelaarStatus = medebeoordelaarGewijzigd
    ? "toegestaan"
    : existing.medebeoordelaarStatus;

  const rows = (await sql`
    UPDATE gesprekken SET
      medewerker_naam = ${meta.medewerkerNaam},
      medewerker_email = ${nextMedewerkerEmail},
      wereld = ${meta.wereld},
      bij_precon_sinds = ${meta.bijPreconSinds},
      gesprek_datum = ${meta.gesprekDatum},
      datum_vorig = ${meta.datumVorig},
      datum_volgend = ${meta.datumVolgend},
      hoofdbeoordelaar = ${meta.hoofdbeoordelaar},
      hoofdbeoordelaar_status = ${nextHoofdbeoordelaarStatus},
      medebeoordelaar = ${meta.medebeoordelaar},
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

  const eigen = alle.filter((g) => g.medewerkerEmail?.toLowerCase() === email);
  const alsHoofdbeoordelaar = alle.filter(
    (g) => g.hoofdbeoordelaar.trim().toLowerCase() === email,
  );
  const alsMedebeoordelaar = alle.filter(
    (g) => g.medebeoordelaar.trim().toLowerCase() === email,
  );
  const pendingGoedkeuringen = await getPendingGoedkeuringen(userEmail);

  return {
    eigen,
    alsHoofdbeoordelaar,
    alsMedebeoordelaar,
    pendingGoedkeuringen,
  };
}

/**
 * Een beoordelaar koppelt zichzelf aan een medewerker (via de naam-dropdown op
 * het dashboard). Bewust zonder toegangscheck — dat is het hele punt: de
 * koppeling staat op 'in_afwachting' totdat de medewerker akkoord geeft.
 *
 * Heeft de medewerker nog geen enkel gesprek, dan start deze actie er meteen
 * een als concept. Zo kan een notulist het gesprek aanmaken zonder te wachten
 * tot de medewerker zelf een keer heeft ingelogd. Het akkoord blijft nodig.
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

  // Alleen voor wie ook echt kan inloggen — anders levert een typefout een
  // gesprek op dat niemand ooit kan openen.
  if (!row && !(await findUserByEmail(medewerkerEmail))) {
    throw new MedewerkerNietGevondenError();
  }

  const existing = row
    ? mapRow(row)
    : await createGesprek(beoordelaarEmail, undefined, medewerkerEmail);
  const huidigeWaarde =
    rol === "hoofdbeoordelaar"
      ? existing.hoofdbeoordelaar
      : existing.medebeoordelaar;
  if (huidigeWaarde.trim() !== "") throw new BeoordelaarAlGekoppeldError();

  const updated = (
    rol === "hoofdbeoordelaar"
      ? await sql`
        UPDATE gesprekken SET
          hoofdbeoordelaar = ${beoordelaarEmail},
          hoofdbeoordelaar_status = 'in_afwachting'
        WHERE id = ${existing.id}
        RETURNING *
      `
      : await sql`
        UPDATE gesprekken SET
          medebeoordelaar = ${beoordelaarEmail},
          medebeoordelaar_status = 'in_afwachting'
        WHERE id = ${existing.id}
        RETURNING *
      `
  ) as GesprekRow[];

  const updatedRow = updated[0];
  if (!updatedRow) throw new Error("Koppelen mislukt");
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
          UPDATE gesprekken SET hoofdbeoordelaar = '', hoofdbeoordelaar_status = 'toegestaan'
          WHERE id = ${gesprekId} RETURNING *
        `
        : await sql`
          UPDATE gesprekken SET medebeoordelaar = '', medebeoordelaar_status = 'toegestaan'
          WHERE id = ${gesprekId} RETURNING *
        `
  ) as GesprekRow[];

  const row = rows[0];
  if (!row) return null;
  return mapRow(row);
}
