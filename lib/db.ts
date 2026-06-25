import { neon } from "@neondatabase/serverless";

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export const sql = neon(process.env.DATABASE_URL ?? "");

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!hasDatabase()) return false;
  try {
    await sql`SELECT 1 AS ok`;
    return true;
  } catch {
    return false;
  }
}
