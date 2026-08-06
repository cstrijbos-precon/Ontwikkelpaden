import { sql } from "@/lib/db";

export interface OpgeslagenGebruiker {
  email: string;
  passwordHash: string;
}

interface AppUserRow {
  email: string;
  password_hash: string;
}

export async function vindOpgeslagenGebruiker(
  email: string,
): Promise<OpgeslagenGebruiker | undefined> {
  const rows = (await sql`
    SELECT email, password_hash FROM app_users
    WHERE email = ${email.toLowerCase().trim()}
    LIMIT 1
  `) as AppUserRow[];

  const row = rows[0];
  return row
    ? { email: row.email, passwordHash: row.password_hash }
    : undefined;
}

/**
 * Legt een nieuw account vast. Geeft `false` terug als het adres al bestaat —
 * een tweede registratie mag nooit het wachtwoord van de eerste overschrijven.
 */
export async function maakOpgeslagenGebruiker(
  email: string,
  passwordHash: string,
): Promise<boolean> {
  const rows = (await sql`
    INSERT INTO app_users (email, password_hash)
    VALUES (${email.toLowerCase().trim()}, ${passwordHash})
    ON CONFLICT (email) DO NOTHING
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
}

export async function listOpgeslagenAccounts(): Promise<AccountOverzicht[]> {
  const rows = (await sql`
    SELECT email, aangemaakt_op, laatst_ingelogd_op FROM app_users
    ORDER BY email
  `) as {
    email: string;
    aangemaakt_op: string;
    laatst_ingelogd_op: string | null;
  }[];

  return rows.map((row) => ({
    email: row.email,
    aangemaaktOp: row.aangemaakt_op,
    laatstIngelogdOp: row.laatst_ingelogd_op,
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
  const rows = (await sql`
    DELETE FROM app_users
    WHERE email = ${email.toLowerCase().trim()}
    RETURNING email
  `) as { email: string }[];

  return rows.length > 0;
}

export async function listOpgeslagenEmails(): Promise<string[]> {
  const rows = (await sql`
    SELECT email FROM app_users ORDER BY email
  `) as { email: string }[];

  return rows.map((row) => row.email);
}
