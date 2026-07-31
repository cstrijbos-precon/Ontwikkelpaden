import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import {
  GeenToegangError,
  respondBeoordelaarKoppeling,
} from "@/lib/gesprekken";
import { beoordelaarStatusBodySchema } from "@/lib/gesprekken-schema";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
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

  const parsed = beoordelaarStatusBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const gesprek = await respondBeoordelaarKoppeling(
      id,
      session.user.email,
      session.user.isAdmin ?? false,
      parsed.data.rol,
      parsed.data.actie,
    );
    if (!gesprek) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(gesprek);
  } catch (error) {
    if (error instanceof GeenToegangError) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return Response.json(
      { error: "Failed to update beoordelaar status" },
      { status: 500 },
    );
  }
}
