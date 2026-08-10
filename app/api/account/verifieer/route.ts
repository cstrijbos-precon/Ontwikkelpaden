import { z } from "zod";
import { hasDatabase } from "@/lib/db";
import { verzilverToken } from "@/lib/email-verificatie";

const bodySchema = z.object({ token: z.string() }).strict();

const REDEN_TEKST: Record<string, string> = {
  onbekend:
    "Deze link kennen we niet. Controleer of je de volledige link hebt geplakt.",
  verlopen:
    "Deze link is verlopen. Meld je opnieuw aan, dan sturen we een nieuwe.",
  gebruikt:
    "Deze link is al gebruikt. Je kunt gewoon inloggen met je wachtwoord.",
};

/** Wisselt de link uit de mail in voor een bevestigd account. */
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
  if (!parsed.success || !parsed.data.token.trim()) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  const resultaat = await verzilverToken(parsed.data.token.trim());

  if (!resultaat.gelukt) {
    return Response.json(
      { error: REDEN_TEKST[resultaat.reden], reden: resultaat.reden },
      { status: 400 },
    );
  }

  return Response.json({ email: resultaat.email });
}
