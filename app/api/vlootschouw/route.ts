import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { isMtLid } from "@/lib/is-mt";
import { getVlootschouwOverzicht } from "@/lib/vlootschouw/overzicht";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // De Vlootschouw is alleen voor het MT.
  if (!isMtLid(session.user.email)) {
    return Response.json({ error: "Alleen voor het MT" }, { status: 403 });
  }

  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const overzicht = await getVlootschouwOverzicht();
    return Response.json(overzicht);
  } catch {
    return Response.json(
      { error: "Failed to load vlootschouw" },
      { status: 500 },
    );
  }
}
