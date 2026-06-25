export interface GesprekAccessFields {
  createdBy: string;
  medewerkerEmail: string | null;
}

export function canAccessGesprek(
  gesprek: GesprekAccessFields,
  userEmail: string,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  const email = userEmail.toLowerCase();
  if (gesprek.createdBy.toLowerCase() === email) return true;
  if (gesprek.medewerkerEmail?.toLowerCase() === email) return true;
  return false;
}
