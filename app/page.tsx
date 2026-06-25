import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { HomePage } from "@/components/organisms/HomePage";

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <HomePage
      email={session.user?.email ?? ""}
      isAdmin={session.user?.isAdmin ?? false}
    />
  );
}
