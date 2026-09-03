import { findUserByEmail } from "@/lib/auth-users";
import { sql } from "@/lib/db";
import type { BeoordelaarStatus } from "@/lib/gesprekken-access";

export interface HoofdbeoordelaarKoppeling {
  medewerkerEmail: string;
  hoofdbeoordelaarEmail: string;
  status: BeoordelaarStatus;
  aangemaaktDoor: string;
}

interface KoppelingRow {
  medewerker_email: string;
  hoofdbeoordelaar_email: string;
  status: BeoordelaarStatus;
  aangemaakt_door: string;
}

function mapRow(row: KoppelingRow): HoofdbeoordelaarKoppeling {
  return {
    medewerkerEmail: row.medewerker_email,
    hoofdbeoordelaarEmail: row.hoofdbeoordelaar_email,
    status: row.status,
    aangemaaktDoor: row.aangemaakt_door,
  };
}

/**
 * Legt vast wie hoofdbeoordelaar is van wie — los van een specifiek gesprek.
 * Eén rij per medewerker: een nieuwe koppeling vervangt de vorige, en de
 * vorige hoofdbeoordelaar verliest daarmee de doorlopende toegang.
 *
 * Heeft de medewerker nog geen account, dan is er niemand om goedkeuring aan
 * te vragen — net als bij de koppeling per gesprek is de koppeling dan meteen
 * toegestaan, anders lopen we vast voordat iemand voor het eerst inlogt.
 */
export async function stelHoofdbeoordelaarVoor(
  medewerkerEmail: string,
  hoofdbeoordelaarEmail: string,
  aangemaaktDoor: string,
): Promise<HoofdbeoordelaarKoppeling> {
  const heeftAccount = Boolean(await findUserByEmail(medewerkerEmail));
  const status: BeoordelaarStatus = heeftAccount
    ? "in_afwachting"
    : "toegestaan";

  const rows = (await sql`
    INSERT INTO hoofdbeoordelaar_koppelingen (
      medewerker_email, hoofdbeoordelaar_email, status, aangemaakt_door
    ) VALUES (
      ${medewerkerEmail}, ${hoofdbeoordelaarEmail}, ${status}, ${aangemaaktDoor}
    )
    ON CONFLICT (medewerker_email) DO UPDATE SET
      hoofdbeoordelaar_email = EXCLUDED.hoofdbeoordelaar_email,
      status = EXCLUDED.status,
      aangemaakt_door = EXCLUDED.aangemaakt_door,
      bijgewerkt_op = now()
    RETURNING *
  `) as KoppelingRow[];

  const row = rows[0];
  if (!row) throw new Error("Koppelen mislukt");
  return mapRow(row);
}

/**
 * Meteen toegestaan, zonder wachten op goedkeuring: voor het geval waarin de
 * medewerker zelf, in zijn of haar eigen gesprek, een hoofdbeoordelaar
 * invult. Dat is al een bewuste eigen keuze — dezelfde regel als bij de
 * koppeling per gesprek.
 */
export async function stelHoofdbeoordelaarVoorDirect(
  medewerkerEmail: string,
  hoofdbeoordelaarEmail: string,
): Promise<void> {
  await sql`
    INSERT INTO hoofdbeoordelaar_koppelingen (
      medewerker_email, hoofdbeoordelaar_email, status, aangemaakt_door
    ) VALUES (
      ${medewerkerEmail}, ${hoofdbeoordelaarEmail}, 'toegestaan', ${medewerkerEmail}
    )
    ON CONFLICT (medewerker_email) DO UPDATE SET
      hoofdbeoordelaar_email = EXCLUDED.hoofdbeoordelaar_email,
      status = 'toegestaan',
      aangemaakt_door = EXCLUDED.aangemaakt_door,
      bijgewerkt_op = now()
  `;
}

export async function haalHoofdbeoordelaarKoppeling(
  medewerkerEmail: string,
): Promise<HoofdbeoordelaarKoppeling | null> {
  const rows = (await sql`
    SELECT * FROM hoofdbeoordelaar_koppelingen
    WHERE LOWER(medewerker_email) = LOWER(${medewerkerEmail})
  `) as KoppelingRow[];
  const row = rows[0];
  return row ? mapRow(row) : null;
}

/** Iedereen die deze hoofdbeoordelaar mag inzien (status 'toegestaan'). */
export async function haalMedewerkersVoorHoofdbeoordelaar(
  hoofdbeoordelaarEmail: string,
): Promise<string[]> {
  const rows = (await sql`
    SELECT medewerker_email FROM hoofdbeoordelaar_koppelingen
    WHERE LOWER(hoofdbeoordelaar_email) = LOWER(${hoofdbeoordelaarEmail})
      AND status = 'toegestaan'
  `) as { medewerker_email: string }[];
  return rows.map((r) => r.medewerker_email);
}

/** Voor de goedkeuringspop-up bij het inloggen van de medewerker. */
export async function haalWachtendeHoofdbeoordelaar(
  medewerkerEmail: string,
): Promise<HoofdbeoordelaarKoppeling | null> {
  const koppeling = await haalHoofdbeoordelaarKoppeling(medewerkerEmail);
  return koppeling?.status === "in_afwachting" ? koppeling : null;
}

export async function isStandingHoofdbeoordelaar(
  medewerkerEmail: string | null,
  userEmail: string,
): Promise<boolean> {
  if (!medewerkerEmail) return false;
  const koppeling = await haalHoofdbeoordelaarKoppeling(medewerkerEmail);
  return (
    koppeling?.status === "toegestaan" &&
    koppeling.hoofdbeoordelaarEmail.toLowerCase() === userEmail.toLowerCase()
  );
}

/** De medewerker (of een beheerder) keurt de koppeling goed of wijst hem af. */
export async function beantwoordHoofdbeoordelaarKoppeling(
  medewerkerEmail: string,
  actie: "goedkeuren" | "afwijzen",
): Promise<void> {
  if (actie === "afwijzen") {
    await sql`
      DELETE FROM hoofdbeoordelaar_koppelingen
      WHERE LOWER(medewerker_email) = LOWER(${medewerkerEmail})
    `;
    return;
  }
  await sql`
    UPDATE hoofdbeoordelaar_koppelingen SET status = 'toegestaan', bijgewerkt_op = now()
    WHERE LOWER(medewerker_email) = LOWER(${medewerkerEmail})
  `;
}
