import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { createGesprekBodySchema } from "@/lib/gesprekken-schema";
import { createGesprek, listGesprekken } from "@/lib/gesprekken";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const items = await listGesprekken(
      session.user.email,
      session.user.isAdmin ?? false,
    );
    return Response.json({ items });
  } catch {
    return Response.json({ error: "Failed to list gesprekken" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createGesprekBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const gesprek = await createGesprek(
      session.user.email,
      parsed.data.state,
      parsed.data.medewerkerEmail,
    );
    return Response.json(gesprek, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create gesprek" }, { status: 500 });
  }
}
