/** Regels rond zelf een account aanmaken. Puur, zodat ze te testen zijn. */

export const MINIMALE_WACHTWOORDLENGTE = 10;

const STANDAARD_DOMEINEN = ["precongroup.com", "tal-leadership.nl"];

/**
 * Welke e-maildomeinen zich mogen registreren. Instelbaar via
 * `APP_EMAIL_DOMEINEN` (kommagescheiden), met de Précon-domeinen als default.
 *
 * Dit is de enige harde grens rond zelfregistratie: er is geen verificatiemail,
 * dus zonder deze lijst zou iedereen op internet een account kunnen maken.
 */
export function toegestaneDomeinen(): string[] {
  const uitEnv = (process.env.APP_EMAIL_DOMEINEN || "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  return uitEnv.length > 0 ? uitEnv : STANDAARD_DOMEINEN;
}

export function isGeldigEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function domeinIsToegestaan(email: string): boolean {
  const domein = email.toLowerCase().trim().split("@")[1];
  if (!domein) return false;
  return toegestaneDomeinen().includes(domein);
}

/**
 * Adressen die zonder verificatiemail een account mogen maken, uit
 * `APP_VERIFICATIE_UITZONDERINGEN`. Bedoeld om te kunnen testen zolang er nog
 * geen mailkanaal is ingesteld.
 *
 * Let op wat dit betekent: voor precies deze adressen geldt weer dat wie het
 * adres kent zich ermee kan aanmelden. Houd de lijst dus kort en haal hem weg
 * zodra het versturen werkt. Losse adressen, geen domeinen — een domein hier
 * zou de beveiliging voor iedereen uitschakelen.
 */
export function verificatieUitzondering(email: string): boolean {
  const adres = email.toLowerCase().trim();
  return (process.env.APP_VERIFICATIE_UITZONDERINGEN || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"))
    .includes(adres);
}

/** Een gedeelde code die intern rondgaat; leeg laten schakelt de eis uit. */
export function registratiecodeVereist(): boolean {
  return (process.env.APP_REGISTRATIECODE || "").trim() !== "";
}

export function registratiecodeKlopt(code: string | undefined): boolean {
  const verwacht = (process.env.APP_REGISTRATIECODE || "").trim();
  if (verwacht === "") return true;
  return (code || "").trim() === verwacht;
}

export function wachtwoordProbleem(wachtwoord: string): string | null {
  if (wachtwoord.length < MINIMALE_WACHTWOORDLENGTE) {
    return `Kies een wachtwoord van minstens ${MINIMALE_WACHTWOORDLENGTE} tekens.`;
  }
  if (!/[a-zA-Z]/.test(wachtwoord) || !/[0-9]/.test(wachtwoord)) {
    return "Gebruik minstens één letter en één cijfer.";
  }
  return null;
}
