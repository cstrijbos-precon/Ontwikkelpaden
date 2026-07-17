import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { setAgendaField } from "@/lib/verbeterplanning/agenda";
import { verbeterplanningErrorResponse } from "@/lib/verbeterplanning/errors";
import {
  agendaMonthIndexSchema,
  setAgendaFieldBodySchema,
} from "@/lib/verbeterplanning/schema";

interface RouteContext {
  params: Promise<{ monthIndex: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const { monthIndex: monthIndexParam } = await context.params;
  const monthIndexParsed = agendaMonthIndexSchema.safeParse(monthIndexParam);
  if (!monthIndexParsed.success) {
    return Response.json({ error: "Invalid monthIndex" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = setAgendaFieldBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const entry = await setAgendaField(
      monthIndexParsed.data,
      session.user.email,
      parsed.data,
    );
    return Response.json(entry);
  } catch (error) {
    return verbeterplanningErrorResponse(error);
  }
}
