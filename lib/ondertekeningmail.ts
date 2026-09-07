import { mailIsIngesteld, verstuurMail } from "@/lib/mailer";
import { isGeldigEmail } from "@/lib/registratie";
import { appUrl } from "@/lib/verificatiemail";
import type { Gesprek } from "@/types/gesprekken";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

export type OndertekenRol =
  | "professional"
  | "hoofdbeoordelaar"
  | "medebeoordelaar";

const ROL_LABEL: Record<OndertekenRol, string> = {
  professional: "de professional",
  hoofdbeoordelaar: "de hoofdbeoordelaar",
  medebeoordelaar: "de medebeoordelaar",
};

/** Op scherm 8 (Afronding) staan de handtekeningen. */
const AFRONDING_SCHERM = 7;

/**
 * Welke rollen zojuist voor het eerst hebben getekend, door de oude en de
 * nieuwe state te vergelijken. Een akkoordvlag kan alleen van false naar true
 * gaan via het zetten van een handtekening, nooit andersom (afronden is
 * definitief) — dus een overgang is altijd een verse ondertekening.
 */
export function bepaalNieuweOndertekeningen(
  vorige: OntwikkelpadenState,
  nieuwe: OntwikkelpadenState,
): OndertekenRol[] {
  const rollen: OndertekenRol[] = [];
  if (!vorige.akkoordProfessional && nieuwe.akkoordProfessional) {
    rollen.push("professional");
  }
  if (!vorige.akkoordHoofdbeoordelaar && nieuwe.akkoordHoofdbeoordelaar) {
    rollen.push("hoofdbeoordelaar");
  }
  if (!vorige.akkoordMedebeoordelaar && nieuwe.akkoordMedebeoordelaar) {
    rollen.push("medebeoordelaar");
  }
  return rollen;
}

function emailVoorRol(gesprek: Gesprek, rol: OndertekenRol): string | null {
  const waarde =
    rol === "professional"
      ? gesprek.medewerkerEmail
      : rol === "hoofdbeoordelaar"
        ? gesprek.hoofdbeoordelaar
        : gesprek.medebeoordelaar;
  return waarde && isGeldigEmail(waarde) ? waarde : null;
}

function naamVoorRol(state: OntwikkelpadenState, rol: OndertekenRol): string {
  return (
    (rol === "professional"
      ? state.akkoordProfessionalNaam
      : rol === "hoofdbeoordelaar"
        ? state.akkoordHoofdbeoordelaarNaam
        : state.akkoordMedebeoordelaarNaam) || ROL_LABEL[rol]
  );
}

/**
 * Mailt iedereen die nog moet tekenen — niet alleen de eerstvolgende, maar
 * alle openstaande rollen tegelijk, zodat niemand hoeft te wachten tot een
 * ander alvast een seintje geeft.
 *
 * Vergeet mislukt: iemand die net getekend heeft, mag daar niet op stuklopen
 * omdat de mailserver even hapert. Elke fout wordt hier zelf opgevangen.
 */
export async function mailOndertekenaars(
  gesprek: Gesprek,
  getekendDoor: OndertekenRol,
): Promise<void> {
  if (!mailIsIngesteld()) return;

  const state = gesprek.state;
  const alleRollen: OndertekenRol[] = [
    "professional",
    "hoofdbeoordelaar",
    "medebeoordelaar",
  ];
  const nogNodig = alleRollen.filter((rol) => {
    if (rol === getekendDoor) return false;
    const akkoord =
      rol === "professional"
        ? state.akkoordProfessional
        : rol === "hoofdbeoordelaar"
          ? state.akkoordHoofdbeoordelaar
          : state.akkoordMedebeoordelaar;
    return !akkoord;
  });

  const ondertekenaar = naamVoorRol(state, getekendDoor);
  const link = `${appUrl()}/gesprekken/${gesprek.id}/bewerken?scherm=${AFRONDING_SCHERM}`;

  for (const rol of nogNodig) {
    const aan = emailVoorRol(gesprek, rol);
    if (!aan) continue;

    try {
      await verstuurMail({
        aan,
        onderwerp: `Handtekening gevraagd — functioneringsgesprek ${gesprek.medewerkerNaam}`,
        tekst: [
          `${ondertekenaar} heeft zojuist getekend voor het functioneringsgesprek van ${gesprek.medewerkerNaam}.`,
          "Het is nu aan jou om je handtekening te zetten.",
          "",
          link,
        ].join("\n"),
        html: `<!doctype html>
<html lang="nl"><body style="font-family:Arial,Helvetica,sans-serif;color:#33393f;line-height:1.6">
  <h2 style="color:#003366;font-size:18px">Handtekening gevraagd</h2>
  <p><strong>${ondertekenaar}</strong> heeft zojuist getekend voor het functioneringsgesprek van
     <strong>${gesprek.medewerkerNaam}</strong>. Het is nu aan jou om je handtekening te zetten.</p>
  <p style="margin:24px 0">
    <a href="${link}" style="background:#E87722;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Naar het gesprek</a>
  </p>
  <p style="font-size:13px;color:#6b7480">Werkt de knop niet? Plak deze link in je browser:<br>
    <span style="word-break:break-all">${link}</span></p>
</body></html>`,
      });
    } catch {
      // Best effort: opslaan is al gelukt, een mislukte mail mag dat niet terugdraaien.
    }
  }
}
