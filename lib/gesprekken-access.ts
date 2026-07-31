export type BeoordelaarStatus = "in_afwachting" | "toegestaan";

export interface GesprekAccessFields {
  createdBy: string;
  medewerkerEmail: string | null;
  hoofdbeoordelaar?: string | null;
  hoofdbeoordelaarStatus?: BeoordelaarStatus;
  medebeoordelaar?: string | null;
  medebeoordelaarStatus?: BeoordelaarStatus;
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
  if (
    gesprek.hoofdbeoordelaar?.toLowerCase() === email &&
    (gesprek.hoofdbeoordelaarStatus ?? "toegestaan") === "toegestaan"
  ) {
    return true;
  }
  if (
    gesprek.medebeoordelaar?.toLowerCase() === email &&
    (gesprek.medebeoordelaarStatus ?? "toegestaan") === "toegestaan"
  ) {
    return true;
  }
  return false;
}
