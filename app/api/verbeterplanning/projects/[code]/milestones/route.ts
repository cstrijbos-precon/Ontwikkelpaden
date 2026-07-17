import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { verbeterplanningErrorResponse } from "@/lib/verbeterplanning/errors";
import { createMilestone } from "@/lib/verbeterplanning/milestones";
import { createMilestoneBodySchema } from "@/lib/verbeterplanning/schema";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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

  const parsed = createMilestoneBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const milestone = await createMilestone(
      code,
      session.user.email,
      parsed.data.name,
    );
    return Response.json(milestone, { status: 201 });
  } catch (error) {
    return verbeterplanningErrorResponse(error);
  }
}
