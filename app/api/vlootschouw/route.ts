import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { getVlootschouwOverzicht } from "@/lib/vlootschouw/overzicht";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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
