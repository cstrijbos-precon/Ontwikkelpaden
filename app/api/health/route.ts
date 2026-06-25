import { auth } from "@/auth";
import { checkDatabaseConnection, hasDatabase } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbConfigured = hasDatabase();
  const dbConnected = dbConfigured ? await checkDatabaseConnection() : false;

  return Response.json({
    ok: true,
    email: session.user?.email,
    isAdmin: session.user?.isAdmin ?? false,
    database: {
      configured: dbConfigured,
      connected: dbConnected,
    },
  });
}
