import { redirect } from "next/navigation";
import { auth } from "@/auth";
import VerbeterplanningApp from "@/components/organisms/VerbeterplanningApp";
import { hasDatabase } from "@/lib/db";

export default async function VerbeterplanningPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  if (!hasDatabase()) {
    return <div style={{ padding: 40 }}>Database niet ingesteld.</div>;
  }

  return <VerbeterplanningApp />;
}
