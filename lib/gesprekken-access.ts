export type BeoordelaarStatus = "in_afwachting" | "toegestaan";

export interface GesprekAccessFields {
  createdBy: string;
  medewerkerEmail: string | null;
  hoofdbeoordelaar?: string | null;
  hoofdbeoordelaarStatus?: BeoordelaarStatus;
  medebeoordelaar?: string | null;
  medebeoordelaarStatus?: BeoordelaarStatus;
}

/**
 * Een beoordelaar mag het gesprek zien zodra hij is toegevoegd, ook als de
 * medewerker de koppeling nog moet goedkeuren. Anders staat een notulist die
 * net een gesprek heeft aangemaakt voor een dichte deur.
 *
 * De goedkeuring blijft bestaan als bevestiging door de medewerker; in het
 * scherm staat tot die tijd dat er nog op gewacht wordt.
 */
export function canAccessGesprek(
  gesprek: GesprekAccessFields,
  userEmail: string,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  const email = userEmail.toLowerCase();
  if (gesprek.createdBy.toLowerCase() === email) return true;
  if (gesprek.medewerkerEmail?.toLowerCase() === email) return true;
  if (gesprek.hoofdbeoordelaar?.toLowerCase() === email) return true;
  if (gesprek.medebeoordelaar?.toLowerCase() === email) return true;
  return false;
}

export interface KoppelingVelden {
  hoofdbeoordelaar?: string | null;
  hoofdbeoordelaarStatus?: BeoordelaarStatus;
  medebeoordelaar?: string | null;
  medebeoordelaarStatus?: BeoordelaarStatus;
}

/** Welke koppelingen nog op akkoord van de medewerker wachten. */
export function wachtendeKoppelingen(
  gesprek: KoppelingVelden,
): ("hoofdbeoordelaar" | "medebeoordelaar")[] {
  const wachtend: ("hoofdbeoordelaar" | "medebeoordelaar")[] = [];
  if (
    gesprek.hoofdbeoordelaar?.trim() &&
    gesprek.hoofdbeoordelaarStatus === "in_afwachting"
  ) {
    wachtend.push("hoofdbeoordelaar");
  }
  if (
    gesprek.medebeoordelaar?.trim() &&
    gesprek.medebeoordelaarStatus === "in_afwachting"
  ) {
    wachtend.push("medebeoordelaar");
  }
  return wachtend;
}
