import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { isMtLid } from "@/lib/is-mt";
import { upsertPlanningCel } from "@/lib/vlootschouw/planning";
import { updatePlanningBodySchema } from "@/lib/vlootschouw/schema";

export async function PUT(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updatePlanningBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    await upsertPlanningCel(session.user.email, parsed.data);
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Failed to update planning" },
      { status: 500 },
    );
  }
}
