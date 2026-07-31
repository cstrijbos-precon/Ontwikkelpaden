import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Dashboard } from "@/components/organisms/Dashboard";
import { hasDatabase } from "@/lib/db";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (!hasDatabase()) {
    return (
      <div className="scherm" style={{ textAlign: "center", padding: 48 }}>
        Database niet ingesteld.
      </div>
    );
  }

  return <Dashboard />;
}
