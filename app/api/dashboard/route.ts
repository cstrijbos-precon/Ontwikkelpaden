import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { getDashboardOverzicht } from "@/lib/gesprekken";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const overzicht = await getDashboardOverzicht(
      session.user.email,
      session.user.isAdmin ?? false,
    );
    return Response.json(overzicht);
  } catch {
    return Response.json(
      { error: "Failed to load dashboard" },
      { status: 500 },
    );
  }
}
