import { auth } from "@/auth";
import { hasDatabase } from "@/lib/db";
import { getBoard } from "@/lib/verbeterplanning/board";
import { verbeterplanningErrorResponse } from "@/lib/verbeterplanning/errors";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const board = await getBoard();
    return Response.json(board);
  } catch (error) {
    return verbeterplanningErrorResponse(error);
  }
}
