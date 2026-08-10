import { type NeonQueryFunction, neon } from "@neondatabase/serverless";

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let client: NeonQueryFunction<false, false> | null = null;

/**
 * De verbinding wordt pas bij de eerste query opgezet. `neon()` gooit namelijk
 * meteen een fout als er geen connectiestring is, en dat gebeurde vroeger al
 * bij het importeren van dit bestand — waardoor `hasDatabase()` nooit de kans
 * kreeg om de vraag netjes te beantwoorden.
 */
function getClient(): NeonQueryFunction<false, false> {
  if (!client) {
    client = neon(process.env.DATABASE_URL ?? "");
  }
  return client;
}

export const sql = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  getClient()(strings, ...values)) as NeonQueryFunction<false, false>;

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!hasDatabase()) return false;
  try {
    await sql`SELECT 1 AS ok`;
    return true;
  } catch {
    return false;
  }
}
