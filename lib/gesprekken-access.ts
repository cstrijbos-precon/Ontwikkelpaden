export type BeoordelaarStatus = "in_afwachting" | "toegestaan";

export interface GesprekAccessFields {
  createdBy: string;
  medewerkerEmail: string | null;
  hoofdbeoordelaar?: string | null;
  hoofdbeoordelaarStatus?: BeoordelaarStatus;
  medebeoordelaar?: string | null;
  medebeoordelaarStatus?: BeoordelaarStatus;
  /** E-mailadressen die de medewerker expliciet heeft afgewezen als beoordelaar. */
  toegangGeweigerdVoor?: string[];
}

/**
 * De aanmaker van een gesprek (created_by) houdt er altijd toegang toe — dat
 * dekt de notulist die het net heeft aangemaakt en anders voor een dichte
 * deur zou staan, zolang de medewerker die persoon niet expliciet heeft
 * afgewezen.
 *
 * Hoofd- en medebeoordelaar geven pas toegang zodra de medewerker de
 * koppeling heeft goedgekeurd (status 'toegestaan'). Vóór die tijd staat er
 * alleen een aanvraag klaar — wie zichzelf aan wie dan ook koppelt, kan
 * anders bij goedkeuring nog niet gegeven meteen alles lezen en bewerken.
 */
export function canAccessGesprek(
  gesprek: GesprekAccessFields,
  userEmail: string,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  const email = userEmail.toLowerCase();
  const geweigerd = gesprek.toegangGeweigerdVoor?.includes(email) ?? false;
  if (gesprek.createdBy.toLowerCase() === email && !geweigerd) return true;
  if (gesprek.medewerkerEmail?.toLowerCase() === email) return true;
  if (
    gesprek.hoofdbeoordelaar?.toLowerCase() === email &&
    gesprek.hoofdbeoordelaarStatus === "toegestaan"
  ) {
    return true;
  }
  if (
    gesprek.medebeoordelaar?.toLowerCase() === email &&
    gesprek.medebeoordelaarStatus === "toegestaan"
  ) {
    return true;
  }
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
