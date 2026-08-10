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
 * Wisselt een token in voor een geverifieerd account. Zet in één keer zowel de
 * markering op het token als de verificatie op het account, zodat een tweede
 * klik op dezelfde link niets meer doet.
 */
export async function verzilverToken(
  token: string,
): Promise<VerificatieResultaat> {
  const rijen = (await sql`
    SELECT email, verloopt_op, gebruikt_op
    FROM email_verificaties
    WHERE token_hash = ${hashToken(token)}
    LIMIT 1
  `) as { email: string; verloopt_op: string; gebruikt_op: string | null }[];

  const rij = rijen[0];
  if (!rij) return { gelukt: false, reden: "onbekend" };
  if (rij.gebruikt_op) return { gelukt: false, reden: "gebruikt" };
  if (new Date(rij.verloopt_op).getTime() < Date.now()) {
    return { gelukt: false, reden: "verlopen" };
  }

  await sql`
    UPDATE email_verificaties SET gebruikt_op = now()
    WHERE token_hash = ${hashToken(token)}
  `;
  await sql`
    UPDATE app_users SET geverifieerd_op = now()
    WHERE email = ${rij.email} AND geverifieerd_op IS NULL
  `;

  return { gelukt: true, email: rij.email };
}
