import { auth } from "@/auth";
import { listOpgeslagenEmails } from "@/lib/app-users-store";
import { parseAppUsers } from "@/lib/auth-users";
import { hasDatabase } from "@/lib/db";

/** Bekende account-e-mailadressen, voor het koppelen van beoordelaars aan een login. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uitEnv = parseAppUsers().map((user) => user.email);
  const uitDatabase = hasDatabase()
    ? await listOpgeslagenEmails().catch(() => [] as string[])
    : [];

  const emails = [...new Set([...uitEnv, ...uitDatabase])].sort();

  return Response.json({ emails });
}
