import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { GesprekNotCompletedError, startNewCycle } from "@/lib/gesprekken";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await context.params;

  try {
    const gesprek = await startNewCycle(
      id,
      session.user.email,
      session.user.isAdmin ?? false,
    );
    if (!gesprek) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(gesprek, { status: 201 });
  } catch (error) {
    if (error instanceof GesprekNotCompletedError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return Response.json(
      { error: "Failed to start new cycle" },
      { status: 500 },
    );
  }
}
