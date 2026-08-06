import bcrypt from "bcryptjs";
import { z } from "zod";
import { maakOpgeslagenGebruiker } from "@/lib/app-users-store";
import { findUserByEmail } from "@/lib/auth-users";
import { hasDatabase } from "@/lib/db";
import {
  domeinIsToegestaan,
  isGeldigEmail,
  registratiecodeKlopt,
  toegestaneDomeinen,
  wachtwoordProbleem,
} from "@/lib/registratie";

const bodySchema = z
  .object({
    email: z.string(),
    wachtwoord: z.string(),
    code: z.string().optional(),
  })
  .strict();

/** Een collega maakt zelf een account aan bij de eerste keer inloggen. */
export async function POST(request: Request) {
  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
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

  // Bestaat het adres al, dan is dit geen registratie maar een inlogpoging.
  if (await findUserByEmail(email)) {
    return Response.json(
      { error: "Dit adres heeft al een account. Log in met je wachtwoord." },
      { status: 409 },
    );
  }

  const hash = await bcrypt.hash(parsed.data.wachtwoord, 12);
  const aangemaakt = await maakOpgeslagenGebruiker(email, hash);

  if (!aangemaakt) {
    // Twee registraties tegelijk; de eerste wint.
    return Response.json(
      { error: "Dit adres heeft al een account. Log in met je wachtwoord." },
      { status: 409 },
    );
  }

  return Response.json({ email }, { status: 201 });
}
