import bcrypt from "bcryptjs";
import { z } from "zod";
import { maakOnbevestigdAccount } from "@/lib/app-users-store";
import { findUserByEmail } from "@/lib/auth-users";
import { hasDatabase } from "@/lib/db";
import { mailIsIngesteld } from "@/lib/mailer";
import {
  domeinIsToegestaan,
  isGeldigEmail,
  registratiecodeKlopt,
  toegestaneDomeinen,
  wachtwoordProbleem,
} from "@/lib/registratie";
import { stuurVerificatiemail } from "@/lib/verificatiemail";

const bodySchema = z
  .object({
    email: z.string(),
    wachtwoord: z.string(),
    code: z.string().optional(),
  })
  .strict();

/**
 * Een collega meldt zich aan. Het account wordt aangemaakt maar geeft nog geen
 * toegang: dat gebeurt pas als de link uit de verificatiemail is gevolgd.
 * Zonder die stap is een e-mailadres geen bewijs van identiteit.
 */
export async function POST(request: Request) {
  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!mailIsIngesteld()) {
    return Response.json(
      {
        error:
          "Aanmelden kan nu niet: de app kan geen verificatiemail versturen. Neem contact op met de beheerder.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();

  if (!isGeldigEmail(email)) {
    return Response.json(
      { error: "Vul een geldig e-mailadres in." },
      { status: 400 },
    );
  }

  if (!domeinIsToegestaan(email)) {
    return Response.json(
      {
        error: `Alleen adressen van ${toegestaneDomeinen().join(" of ")} kunnen hier een account maken.`,
      },
      { status: 403 },
    );
  }

  if (!registratiecodeKlopt(parsed.data.code)) {
    return Response.json(
      { error: "De registratiecode klopt niet. Vraag ernaar bij je manager." },
      { status: 403 },
    );
  }

  const probleem = wachtwoordProbleem(parsed.data.wachtwoord);
  if (probleem) {
    return Response.json({ error: probleem }, { status: 400 });
  }

  // Een bevestigd account hoort hier niet opnieuw langs te komen.
  if (await findUserByEmail(email)) {
    return Response.json(
      { error: "Dit adres heeft al een account. Log in met je wachtwoord." },
      { status: 409 },
    );
  }

  const hash = await bcrypt.hash(parsed.data.wachtwoord, 12);
  if (!(await maakOnbevestigdAccount(email, hash))) {
    return Response.json(
      { error: "Dit adres heeft al een account. Log in met je wachtwoord." },
      { status: 409 },
    );
  }

  try {
    await stuurVerificatiemail(email);
  } catch {
    // Het account staat er wel, maar zonder mail is het onbruikbaar. Beter een
    // eerlijke fout dan iemand laten wachten op een bericht dat nooit komt.
    return Response.json(
      {
        error:
          "Het versturen van de verificatiemail is mislukt. Probeer het later opnieuw of neem contact op met de beheerder.",
      },
      { status: 502 },
    );
  }

  return Response.json({ email, verificatieVerstuurd: true }, { status: 201 });
}
