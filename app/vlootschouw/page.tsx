import { redirect } from "next/navigation";
import { auth } from "@/auth";
import VlootschouwApp from "@/components/organisms/VlootschouwApp";
import { hasDatabase } from "@/lib/db";
import { isMtLid } from "@/lib/is-mt";

export default async function VlootschouwPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  // Alleen het MT; anderen sturen we terug naar hun eigen dashboard in plaats
  // van een foutmelding te tonen.
  if (!isMtLid(session.user.email)) redirect("/dashboard");

  if (!hasDatabase()) {
    return <div style={{ padding: 40 }}>Database niet ingesteld.</div>;
  }

  return <VlootschouwApp />;
}
