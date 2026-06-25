import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({
    ok: true,
    email: session.user?.email,
    isAdmin: session.user?.isAdmin ?? false,
  });
}
