import { createHash, randomBytes } from "node:crypto";
import { sql } from "@/lib/db";

/** Een dag is ruim genoeg om een mail te openen, en kort genoeg om te vervallen. */
const GELDIG_UREN = 24;

/**
 * Het token gaat alleen in de mail; in de database staat de hash. Lekt de
 * tabel, dan levert dat geen werkende links op.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function maakVerificatieToken(email: string): Promise<string> {
  const adres = email.toLowerCase().trim();
  const token = randomBytes(32).toString("base64url");

  // Oudere, nog openstaande links voor dit adres vervallen meteen: er hoort er
  // maar één tegelijk te werken.
  await sql`
    DELETE FROM email_verificaties
    WHERE email = ${adres} AND gebruikt_op IS NULL
  `;

  await sql`
    INSERT INTO email_verificaties (token_hash, email, verloopt_op)
    VALUES (
      ${hashToken(token)},
      ${adres},
      now() + ${`${GELDIG_UREN} hours`}::interval
    )
  `;

  return token;
}

export type VerificatieResultaat =
  | { gelukt: true; email: string }
  | { gelukt: false; reden: "onbekend" | "verlopen" | "gebruikt" };

/**
 * Wisselt een token in voor een geverifieerd account.
 *
 * Eén statement, zodat de markering op het token en de bevestiging van het
 * account samen lukken of samen niet. Als dit twee losse stappen waren, kon
 * een tweede klik op dezelfde link er tussendoor komen, of een storing na de
 * eerste stap een verbrand token achterlaten bij een nog niet bevestigd
 * account — waarna de link "al gebruikt" zegt en inloggen niet kan.
 * De voorwaarden in de WHERE laten maar één van twee gelijktijdige klikken
 * slagen.
 */
export async function verzilverToken(
  token: string,
): Promise<VerificatieResultaat> {
  const hash = hashToken(token);

  const bevestigd = (await sql`
    WITH gebruikt AS (
      UPDATE email_verificaties SET gebruikt_op = now()
      WHERE token_hash = ${hash}
        AND gebruikt_op IS NULL
        AND verloopt_op > now()
      RETURNING email
    ),
    bevestiging AS (
      UPDATE app_users SET geverifieerd_op = now()
      WHERE email IN (SELECT email FROM gebruikt) AND geverifieerd_op IS NULL
    )
    SELECT email FROM gebruikt
  `) as { email: string }[];

  if (bevestigd[0]) return { gelukt: true, email: bevestigd[0].email };

  // Niet gelukt: uitzoeken waarom, zodat de melding klopt.
  const rijen = (await sql`
    SELECT verloopt_op, gebruikt_op
    FROM email_verificaties
    WHERE token_hash = ${hash}
    LIMIT 1
  `) as { verloopt_op: string; gebruikt_op: string | null }[];

  const rij = rijen[0];
  if (!rij) return { gelukt: false, reden: "onbekend" };
  if (rij.gebruikt_op) return { gelukt: false, reden: "gebruikt" };
  if (new Date(rij.verloopt_op).getTime() < Date.now()) {
    return { gelukt: false, reden: "verlopen" };
  }
  // Niet gebruikt en niet verlopen, maar de update pakte het toch niet: een
  // gelijktijdige klik was net eerder.
  return { gelukt: false, reden: "gebruikt" };
}
