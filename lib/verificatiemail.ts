import { maakVerificatieToken } from "@/lib/email-verificatie";
import { verstuurMail } from "@/lib/mailer";

/**
 * Het adres waar de app op draait, voor links in mails.
 *
 * Voorkeur: een vaste APP_URL. Is die niet gezet, dan het vaste
 * productiedomein van het Vercel-project. VERCEL_URL is het laatste redmiddel:
 * dat wijst naar de unieke URL van één specifieke deploy en verandert bij
 * elke release, dus een link in een mail zou na een volgende deploy naar een
 * oude of beschermde preview kunnen wijzen.
 */
export function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function htmlBericht(link: string): string {
  return `<!doctype html>
<html lang="nl"><body style="font-family:Arial,Helvetica,sans-serif;color:#33393f;line-height:1.6">
  <h2 style="color:#003366;font-size:18px">Bevestig je e-mailadres</h2>
  <p>Je hebt zojuist een account aangemaakt voor <strong>Ontwikkelpaden</strong>,
     de tool voor functioneringsgesprekken en POP.</p>
  <p>Klik op de knop om je adres te bevestigen. Daarna kun je inloggen met het
     wachtwoord dat je hebt gekozen.</p>
  <p style="margin:24px 0">
    <a href="${link}" style="background:#E87722;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Bevestig mijn e-mailadres</a>
  </p>
  <p style="font-size:13px;color:#6b7480">Werkt de knop niet? Plak deze link in je browser:<br>
    <span style="word-break:break-all">${link}</span></p>
  <p style="font-size:13px;color:#6b7480">De link is 24 uur geldig.</p>
  <hr style="border:none;border-top:1px solid #dde3ea;margin:24px 0">
  <p style="font-size:13px;color:#6b7480">Heb je zelf geen account aangemaakt? Dan kun je deze mail
     negeren. Zonder bevestiging wordt er niets geactiveerd, en je gegevens
     blijven onbereikbaar voor degene die het adres invulde.</p>
</body></html>`;
}

/** Maakt een verse link en stuurt die naar het opgegeven adres. */
export async function stuurVerificatiemail(email: string): Promise<void> {
  const token = await maakVerificatieToken(email);
  const link = `${appUrl()}/verifieer?token=${encodeURIComponent(token)}`;

  await verstuurMail({
    aan: email,
    onderwerp: "Bevestig je e-mailadres voor Ontwikkelpaden",
    tekst: [
      "Bevestig je e-mailadres",
      "",
      "Je hebt zojuist een account aangemaakt voor Ontwikkelpaden.",
      "Open deze link om je adres te bevestigen:",
      link,
      "",
      "De link is 24 uur geldig.",
      "",
      "Heb je zelf geen account aangemaakt? Dan kun je deze mail negeren.",
    ].join("\n"),
    html: htmlBericht(link),
  });
}
