import { z } from "zod";
import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { respondStandingHoofdbeoordelaar } from "@/lib/gesprekken";

const bodySchema = z.object({
  actie: z.enum(["goedkeuren", "afwijzen"]),
});

/**
 * Alleen de medewerker zelf beantwoordt dit — de koppeling staat op zijn of
 * haar eigen e-mailadres, er is geen los gesprek-id om aan te sturen.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  await respondStandingHoofdbeoordelaar(session.user.email, parsed.data.actie);
  return Response.json({ ok: true });
}
