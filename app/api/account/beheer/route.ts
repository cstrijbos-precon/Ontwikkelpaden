import { z } from "zod";
import { auth } from "@/auth";
import {
  listOpgeslagenAccounts,
  verwijderOpgeslagenGebruiker,
} from "@/lib/app-users-store";
import { findEnvUserByEmail } from "@/lib/auth-users";
import { hasDatabase } from "@/lib/db";

const bodySchema = z.object({ email: z.string() }).strict();

async function eisBeheerder() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isAdmin) {
    return Response.json({ error: "Alleen voor beheerders" }, { status: 403 });
  }
  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }
  return null;
}

export async function GET() {
  const fout = await eisBeheerder();
  if (fout) return fout;

  return Response.json({ accounts: await listOpgeslagenAccounts() });
}

/**
 * Geeft een adres weer vrij. De collega kiest bij de volgende keer inloggen
 * een nieuw wachtwoord; gesprekken blijven staan, want die hangen aan het
 * e-mailadres.
 */
export async function DELETE(request: Request) {
  const fout = await eisBeheerder();
  if (fout) return fout;

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

  if (findEnvUserByEmail(email)) {
    return Response.json(
      {
        error:
          "Dit account staat in de instellingen van de server, niet in de database. Alleen een beheerder kan dat wachtwoord aanpassen in Vercel.",
      },
      { status: 409 },
    );
  }

  if (!(await verwijderOpgeslagenGebruiker(email))) {
    return Response.json({ error: "Onbekend adres." }, { status: 404 });
  }

  return Response.json({ email });
}
