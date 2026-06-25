export interface AppUser {
  email: string;
  passwordHash: string;
}

export function parseAppUsers(): AppUser[] {
  return (process.env.APP_USERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf(":");
      if (idx === -1) return null;
      const email = pair.slice(0, idx).trim().toLowerCase();
      const passwordHash = pair.slice(idx + 1).trim();
      if (!email || !passwordHash.startsWith("$2")) return null;
      return { email, passwordHash };
    })
    .filter((u): u is AppUser => u !== null);
}

export function findUserByEmail(email: string): AppUser | undefined {
  const normalized = email.toLowerCase().trim();
  return parseAppUsers().find((u) => u.email === normalized);
}
