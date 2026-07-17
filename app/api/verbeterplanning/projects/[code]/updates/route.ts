import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { verbeterplanningErrorResponse } from "@/lib/verbeterplanning/errors";
import { createUpdateBodySchema } from "@/lib/verbeterplanning/schema";
import { createUpdate } from "@/lib/verbeterplanning/updates";

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

  const parsed = createUpdateBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const update = await createUpdate(
      code,
      session.user.email,
      parsed.data.text,
    );
    return Response.json(update, { status: 201 });
  } catch (error) {
    return verbeterplanningErrorResponse(error);
  }
}
