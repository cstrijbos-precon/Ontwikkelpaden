import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { getGesprekById, updateGesprek } from "@/lib/gesprekken";
import { updateGesprekBodySchema } from "@/lib/gesprekken-schema";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await context.params;

  try {
    const gesprek = await getGesprekById(
      id,
      session.user.email,
      session.user.isAdmin ?? false,
    );
    if (!gesprek) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(gesprek);
  } catch {
    return Response.json({ error: "Failed to load gesprek" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
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

  const parsed = updateGesprekBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const gesprek = await updateGesprek(
      id,
      session.user.email,
      session.user.isAdmin ?? false,
      parsed.data.state,
      parsed.data.status,
      parsed.data.medewerkerEmail,
    );
    if (!gesprek) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(gesprek);
  } catch {
    return Response.json({ error: "Failed to update gesprek" }, { status: 500 });
  }
}
