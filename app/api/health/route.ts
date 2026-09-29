import { auth } from "@/auth";
import { checkDatabaseConnection, hasDatabase } from "@/lib/db";
import { isAdmin } from "@/lib/is-admin";

/**
 * Alleen voor beheerders — dit is een ops-checkje (DB-status), geen
 * functionaliteit voor gewone gebruikers. Gaf voorheen aan elke ingelogde
 * gebruiker onnodig prijs of de database bereikbaar is.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.email)) {
    return Response.json({ error: "Alleen voor beheerders" }, { status: 403 });
  }

  const dbConfigured = hasDatabase();
  const dbConnected = dbConfigured ? await checkDatabaseConnection() : false;

  return Response.json({
    ok: true,
    email: session.user.email,
    database: {
      configured: dbConfigured,
      connected: dbConnected,
    },
  });
}
