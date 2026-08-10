import { sql } from "@/lib/db";

export interface OpgeslagenGebruiker {
  email: string;
  passwordHash: string;
}

interface AppUserRow {
  email: string;
  password_hash: string;
}

/**
 * Alleen geverifieerde accounts tellen als bestaand. Een registratie die nooit
 * via de mail is bevestigd, geeft dus geen toegang.
 */
export async function vindOpgeslagenGebruiker(
  email: string,
): Promise<OpgeslagenGebruiker | undefined> {
  const rows = (await sql`
    SELECT email, password_hash FROM app_users
    WHERE email = ${email.toLowerCase().trim()}
      AND geverifieerd_op IS NOT NULL
    LIMIT 1
  `) as AppUserRow[];

  const row = rows[0];
  return row
    ? { email: row.email, passwordHash: row.password_hash }
    : undefined;
}

/**
 * Legt een nog te bevestigen account vast.
 *
 * Bestaat er al een onbevestigde registratie op dit adres, dan wordt die
 * overschreven. Dat is met opzet: alleen wie de mailbox heeft, kan de link
 * volgen, dus de echte eigenaar kan zijn adres altijd terugpakken van iemand
 * die het eerder invulde. Een bevestigd account blijft onaangeraakt.
 *
 * Geeft `false` als er al een bevestigd account is.
 */
export async function maakOnbevestigdAccount(
  email: string,
  passwordHash: string,
): Promise<boolean> {
  const rows = (await sql`
    INSERT INTO app_users (email, password_hash)
    VALUES (${email.toLowerCase().trim()}, ${passwordHash})
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          aangemaakt_op = now()
      WHERE app_users.geverifieerd_op IS NULL
    RETURNING email
  `) as { email: string }[];

  return rows.length > 0;
}

export async function noteerLogin(email: string): Promise<void> {
  await sql`
    UPDATE app_users SET laatst_ingelogd_op = now()
    WHERE email = ${email.toLowerCase().trim()}
  `;
}

export interface AccountOverzicht {
  email: string;
  aangemaaktOp: string;
  laatstIngelogdOp: string | null;
  geverifieerd: boolean;
}

export async function listOpgeslagenAccounts(): Promise<AccountOverzicht[]> {
  const rows = (await sql`
    SELECT email, aangemaakt_op, laatst_ingelogd_op, geverifieerd_op
    FROM app_users
    ORDER BY email
  `) as {
    email: string;
    aangemaakt_op: string;
    laatst_ingelogd_op: string | null;
    geverifieerd_op: string | null;
  }[];

  return rows.map((row) => ({
    email: row.email,
    aangemaaktOp: row.aangemaakt_op,
    laatstIngelogdOp: row.laatst_ingelogd_op,
    geverifieerd: row.geverifieerd_op !== null,
  }));
}

/**
 * Maakt een adres weer vrij, zodat de collega bij de volgende keer inloggen
 * een nieuw wachtwoord kiest. De gesprekken blijven staan: die hangen aan het
 * e-mailadres, niet aan deze rij.
 */
export async function verwijderOpgeslagenGebruiker(
  email: string,
): Promise<boolean> {
  const adres = email.toLowerCase().trim();
  await sql`DELETE FROM email_verificaties WHERE email = ${adres}`;

  const rows = (await sql`
    DELETE FROM app_users WHERE email = ${adres} RETURNING email
  `) as { email: string }[];

  return rows.length > 0;
}

/** Alleen bevestigde adressen; voor de keuzelijst met collega's. */
export async function listOpgeslagenEmails(): Promise<string[]> {
  const rows = (await sql`
    SELECT email FROM app_users
    WHERE geverifieerd_op IS NOT NULL
    ORDER BY email
  `) as { email: string }[];

  return rows.map((row) => row.email);
}
