import { auth } from "@/auth";
import { parseAppUsers } from "@/lib/auth-users";

/** Bekende account-e-mailadressen, voor het koppelen van beoordelaars aan een login. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emails = parseAppUsers()
    .map((user) => user.email)
    .sort();

  return Response.json({ emails });
}
