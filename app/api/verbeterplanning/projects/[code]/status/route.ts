import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { isMtLid } from "@/lib/is-mt";
import { verbeterplanningErrorResponse } from "@/lib/verbeterplanning/errors";
import { setProjectMonthStatus } from "@/lib/verbeterplanning/projects";
import { setProjectStatusBodySchema } from "@/lib/verbeterplanning/schema";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // De Verbeterplanning is alleen voor het MT.
  if (!isMtLid(session.user.email)) {
    return Response.json({ error: "Alleen voor het MT" }, { status: 403 });
  }

  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const { code } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = setProjectStatusBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    await setProjectMonthStatus(
      code,
      session.user.email,
      parsed.data.monthIndex,
      parsed.data.status,
    );
    return Response.json(parsed.data);
  } catch (error) {
    return verbeterplanningErrorResponse(error);
  }
}
