import { z } from "zod";
import { findUserByEmail } from "@/lib/auth-users";
import { hasDatabase } from "@/lib/db";
import { mailIsIngesteld } from "@/lib/mailer";
import {
  domeinIsToegestaan,
  isGeldigEmail,
  registratiecodeVereist,
  toegestaneDomeinen,
  verificatieUitzondering,
} from "@/lib/registratie";

const bodySchema = z.object({ email: z.string() }).strict();

/**
 * Vertelt het inlogscherm of dit adres al een account heeft, zodat het kan
 * kiezen tussen "vul je wachtwoord in" en "bedenk een wachtwoord".
 *
 * Bewust openbaar: zonder deze stap kan niemand zich aanmelden. Het verklapt
 * wel of een adres bekend is — een afweging die hoort bij zelfregistratie
 * zonder verificatiemail.
 */
export async function POST(request: Request) {
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
      {
        status: 400,
      },
    );
  }

  if (!domeinIsToegestaan(email)) {
    return Response.json(
      {
        error: `Alleen adressen van ${toegestaneDomeinen().join(" of ")} kunnen hier inloggen.`,
      },
      { status: 403 },
    );
  }

  const bestaand = await findUserByEmail(email);
  const uitgezonderd = verificatieUitzondering(email);

  return Response.json({
    bekend: Boolean(bestaand),
    // Aanmelden kan alleen als er een verificatiemail verstuurd kan worden —
    // of als dit adres daar expliciet van is uitgezonderd.
    registrerenMogelijk: hasDatabase() && (mailIsIngesteld() || uitgezonderd),
    codeNodig: !bestaand && registratiecodeVereist(),
    verificatieNodig: !uitgezonderd,
  });
}
