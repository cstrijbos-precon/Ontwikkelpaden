import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { verbeterplanningErrorResponse } from "@/lib/verbeterplanning/errors";
import { setKpiQuarterNote } from "@/lib/verbeterplanning/kpis";
import { setKpiNoteBodySchema } from "@/lib/verbeterplanning/schema";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = setKpiNoteBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    await setKpiQuarterNote(
      id,
      session.user.email,
      parsed.data.quarterIndex,
      parsed.data.note,
    );
    return Response.json(parsed.data);
  } catch (error) {
    return verbeterplanningErrorResponse(error);
  }
}
