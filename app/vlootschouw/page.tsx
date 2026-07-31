import { redirect } from "next/navigation";
import { auth } from "@/auth";
import VlootschouwApp from "@/components/organisms/VlootschouwApp";
import { hasDatabase } from "@/lib/db";

export default async function VlootschouwPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  if (!hasDatabase()) {
    return <div style={{ padding: 40 }}>Database niet ingesteld.</div>;
  }

  return <VlootschouwApp />;
}
