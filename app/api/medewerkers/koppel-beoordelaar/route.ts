import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import {
  BeoordelaarAlGekoppeldError,
  MedewerkerNietGevondenError,
  requestBeoordelaarKoppeling,
} from "@/lib/gesprekken";
import { koppelBeoordelaarBodySchema } from "@/lib/gesprekken-schema";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = koppelBeoordelaarBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const gesprek = await requestBeoordelaarKoppeling(
      parsed.data.medewerkerEmail,
      parsed.data.rol,
      session.user.email,
    );
    return Response.json(gesprek, { status: 201 });
  } catch (error) {
    if (error instanceof MedewerkerNietGevondenError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof BeoordelaarAlGekoppeldError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return Response.json({ error: "Koppelen mislukt" }, { status: 500 });
  }
}
