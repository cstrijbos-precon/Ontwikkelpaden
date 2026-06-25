export function isAdmin(email: string | null | undefined): boolean {
  const admins = (process.env.APP_ADMINS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (admins.length === 0) return false;
  return admins.includes(String(email || "").toLowerCase());
}
