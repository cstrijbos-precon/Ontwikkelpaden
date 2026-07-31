import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { getBekendeMedewerkers } from "@/lib/gesprekken";

/** Naam+e-mail van iedereen die ooit een eigen gesprek heeft geopend — voor de beoordelaar-dropdown. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const medewerkers = await getBekendeMedewerkers();
    return Response.json({ medewerkers });
  } catch {
    return Response.json(
      { error: "Failed to load medewerkers" },
      { status: 500 },
    );
  }
}
