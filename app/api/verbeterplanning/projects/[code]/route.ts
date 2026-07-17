import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { verbeterplanningErrorResponse } from "@/lib/verbeterplanning/errors";
import { updateProjectMeta } from "@/lib/verbeterplanning/projects";
import { updateProjectMetaBodySchema } from "@/lib/verbeterplanning/schema";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
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

  const parsed = updateProjectMetaBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const project = await updateProjectMeta(
      code,
      session.user.email,
      parsed.data,
    );
    return Response.json(project);
  } catch (error) {
    return verbeterplanningErrorResponse(error);
  }
}
