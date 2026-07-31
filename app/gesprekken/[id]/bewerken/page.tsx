import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OntwikkelpadenApp } from "@/components/organisms/OntwikkelpadenApp";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GesprekBewerkenPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  return <OntwikkelpadenApp gesprekId={id} />;
}
