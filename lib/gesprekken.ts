import { buildNextCycleState } from "@/lib/cycle-carry-over";
import { sql } from "@/lib/db";
import {
  clampPadNiveau,
  clampScore,
  enforceDateOrNull,
  formatDateFromDb,
} from "@/lib/field-format";
import { canAccessGesprek } from "@/lib/gesprekken-access";
import { createInitialState, mergeWithInitialState } from "@/lib/initial-state";
import type {
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
  updated_at: string;
}

interface GesprekRow {
  id: string;
  medewerker_naam: string;
  medewerker_email: string | null;
  bij_precon_sinds: string;
  gesprek_datum: unknown;
  datum_vorig: unknown;
  datum_volgend: unknown;
  hoofdbeoordelaar: string;
  medebeoordelaar: string;
  status: GesprekStatus;
  state: OntwikkelpadenState;
  previous_gesprek_id: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

function metadataFromState(state: OntwikkelpadenState) {
  return {
    medewerkerNaam: state.naam,
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
    bijPreconSinds: row.bij_precon_sinds,
    gesprekDatum: formatDateFromDb(row.gesprek_datum),
    datumVorig: formatDateFromDb(row.datum_vorig),
    datumVolgend: formatDateFromDb(row.datum_volgend),
    hoofdbeoordelaar: row.hoofdbeoordelaar,
    medebeoordelaar: row.medebeoordelaar,
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

  for (const padId of PAD_IDS) {
    await sql`
      INSERT INTO gesprek_paden (
        gesprek_id, pad_id, vorig_jaar_niveau, ambitie, trainingsgroep_id
      ) VALUES (
        ${gesprekId},
        ${padId},
        ${clampPadNiveau(state.vorigJaar[padId])},
        ${state.ambities[padId]},
        ${state.trainingsgroepen[padId]}
      )
      ON CONFLICT (gesprek_id, pad_id) DO UPDATE SET
        vorig_jaar_niveau = EXCLUDED.vorig_jaar_niveau,
        ambitie = EXCLUDED.ambitie,
        trainingsgroep_id = EXCLUDED.trainingsgroep_id
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
               hoofdbeoordelaar, updated_at
        FROM gesprekken
        ORDER BY updated_at DESC
      `
      : await sql`
        SELECT id, medewerker_naam, medewerker_email, gesprek_datum, status,
               hoofdbeoordelaar, updated_at
        FROM gesprekken
        WHERE created_by = ${userEmail}
           OR LOWER(medewerker_email) = LOWER(${userEmail})
        ORDER BY updated_at DESC
      `
  ) as GesprekListRow[];

  return rows.map((row) => ({
    id: row.id,
    medewerkerNaam: row.medewerker_naam,
    medewerkerEmail: row.medewerker_email,
    gesprekDatum: formatDateFromDb(row.gesprek_datum),
    status: row.status,
    hoofdbeoordelaar: row.hoofdbeoordelaar,
    updatedAt: row.updated_at,
  }));
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
): Promise<Gesprek> {
  const state = stateInput
    ? mergeWithInitialState(stateInput)
    : createInitialState();
  const meta = metadataFromState(state);

  const rows = (await sql`
    INSERT INTO gesprekken (
      medewerker_naam, medewerker_email, bij_precon_sinds,
      gesprek_datum, datum_vorig, datum_volgend,
      hoofdbeoordelaar, medebeoordelaar, state, previous_gesprek_id,
      created_by, updated_by
    ) VALUES (
      ${meta.medewerkerNaam},
      ${medewerkerEmail ?? null},
      ${meta.bijPreconSinds},
      ${meta.gesprekDatum},
      ${meta.datumVorig},
      ${meta.datumVolgend},
      ${meta.hoofdbeoordelaar},
      ${meta.medebeoordelaar},
      ${state},
      ${previousGesprekId ?? null},
      ${userEmail},
      ${userEmail}
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

  const rows = (await sql`
    UPDATE gesprekken SET
      medewerker_naam = ${meta.medewerkerNaam},
      medewerker_email = ${nextMedewerkerEmail},
      bij_precon_sinds = ${meta.bijPreconSinds},
      gesprek_datum = ${meta.gesprekDatum},
      datum_vorig = ${meta.datumVorig},
      datum_volgend = ${meta.datumVolgend},
      hoofdbeoordelaar = ${meta.hoofdbeoordelaar},
      medebeoordelaar = ${meta.medebeoordelaar},
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
