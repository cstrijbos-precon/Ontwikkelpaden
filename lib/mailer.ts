/**
 * Verzendt mail via Resend of via SMTP, afhankelijk van wat er is ingesteld.
 *
 * Is er niets ingesteld, dan is er geen verzendkanaal en kan er dus ook niet
 * geverifieerd worden. Registreren wordt dan geweigerd — bewust, want zonder
 * verificatie is het e-mailadres geen bewijs en kan iemand zich voordoen als
 * een collega.
 */

export interface Bericht {
  aan: string;
  onderwerp: string;
  tekst: string;
  html: string;
}

export type MailKanaal = "resend" | "smtp" | "geen";

export function beschikbaarKanaal(): MailKanaal {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SMTP_HOST) return "smtp";
  return "geen";
}

export function mailIsIngesteld(): boolean {
  return beschikbaarKanaal() !== "geen";
}

function afzender(): string {
  return process.env.MAIL_AFZENDER || "Ontwikkelpaden <onboarding@resend.dev>";
}

async function verstuurViaResend(bericht: Bericht): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: afzender(),
      to: [bericht.aan],
      subject: bericht.onderwerp,
      text: bericht.tekst,
      html: bericht.html,
    }),
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Resend weigerde de mail (${res.status}): ${details}`);
  }
}

async function verstuurViaSmtp(bericht: Bericht): Promise<void> {
  const { createTransport } = await import("nodemailer");

  const transport = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transport.sendMail({
    from: afzender(),
    to: bericht.aan,
    subject: bericht.onderwerp,
    text: bericht.tekst,
    html: bericht.html,
  });
}

export async function verstuurMail(bericht: Bericht): Promise<void> {
  switch (beschikbaarKanaal()) {
    case "resend":
      return verstuurViaResend(bericht);
    case "smtp":
      return verstuurViaSmtp(bericht);
    default:
      throw new Error(
        "Er is geen mailkanaal ingesteld, dus de verificatiemail kan niet verstuurd worden.",
      );
  }
}
