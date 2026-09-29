import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GesprekArchiefViewer } from "@/components/organisms/GesprekArchiefViewer";
import { hasDatabase } from "@/lib/db";
import { getGesprekById } from "@/lib/gesprekken";
import { isAdmin } from "@/lib/is-admin";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GesprekArchiefPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const { id } = await params;

  if (!hasDatabase()) {
    return (
      <div className="scherm" style={{ textAlign: "center", padding: 48 }}>
        Database niet ingesteld.
      </div>
    );
  }

  const gesprek = await getGesprekById(
    id,
    session.user.email,
    // Live gecheckt, niet de (mogelijk verouderde) sessie-cookie.
    isAdmin(session.user.email),
  );

  if (!gesprek) {
    return (
      <div className="scherm" style={{ textAlign: "center", padding: 48 }}>
        Dit gesprek is niet gevonden of je hebt er geen toegang toe.
      </div>
    );
  }

  return <GesprekArchiefViewer gesprek={gesprek} />;
}
