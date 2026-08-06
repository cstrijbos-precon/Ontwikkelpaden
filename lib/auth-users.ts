import { vindOpgeslagenGebruiker } from "@/lib/app-users-store";
import { hasDatabase } from "@/lib/db";

export interface AppUser {
  email: string;
  passwordHash: string;
}

/**
 * Accounts komen uit `APP_USERS`, aangevuld met `APP_USERS_EXTRA`.
 *
 * Die tweede variabele bestaat omdat `APP_USERS` in Vercel als *sensitive*
 * is opgeslagen: de waarde is daarna niet meer uit te lezen, alleen in zijn
 * geheel te overschrijven. Iemand toevoegen zou dus betekenen dat je de rest
 * van de lijst kwijtraakt en iedereen buitensluit.
 *
 * Nieuwe accounts komen tegenwoordig in de database (zie `app-users-store`).
 * Deze lijst blijft bestaan voor de mensen die er al in stonden: die zijn niet
 * over te zetten, want hun hashes zijn niet meer op te vragen.
 */
export function parseAppUsers(): AppUser[] {
  const alleParen = [process.env.APP_USERS, process.env.APP_USERS_EXTRA]
    .filter((bron): bron is string => Boolean(bron))
    .join(",");

  const gezien = new Set<string>();

  return alleParen
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf(":");
      if (idx === -1) return null;
      const email = pair.slice(0, idx).trim().toLowerCase();
      const passwordHash = pair.slice(idx + 1).trim();
      if (!email || !passwordHash.startsWith("$2")) return null;
      if (gezien.has(email)) return null;
      gezien.add(email);
      return { email, passwordHash };
    })
    .filter((u): u is AppUser => u !== null);
}

/** Alleen de accounts uit de omgevingsvariabelen. */
export function findEnvUserByEmail(email: string): AppUser | undefined {
  const normalized = email.toLowerCase().trim();
  return parseAppUsers().find((u) => u.email === normalized);
}

/**
 * Zoekt een account: eerst de zelf aangemaakte in de database, daarna de
 * vaste lijst uit de omgevingsvariabelen. Die volgorde maakt niets uit voor
 * bestaande gebruikers — een adres kan maar in één van beide staan, want
 * registreren weigert adressen die al bekend zijn.
 */
export async function findUserByEmail(
  email: string,
): Promise<AppUser | undefined> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) return undefined;

  if (hasDatabase()) {
    const opgeslagen = await vindOpgeslagenGebruiker(normalized);
    if (opgeslagen) return opgeslagen;
  }

  return findEnvUserByEmail(normalized);
}
