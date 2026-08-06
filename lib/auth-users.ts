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
 * van de lijst kwijtraakt en iedereen buitensluit. Met een aparte variabele
 * kun je accounts toevoegen zonder de bestaande ooit aan te raken.
 *
 * Staat een adres in beide lijsten, dan wint het eerste voorkomen uit
 * `APP_USERS` — de oorspronkelijke lijst is leidend.
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

export function findUserByEmail(email: string): AppUser | undefined {
  const normalized = email.toLowerCase().trim();
  return parseAppUsers().find((u) => u.email === normalized);
}
