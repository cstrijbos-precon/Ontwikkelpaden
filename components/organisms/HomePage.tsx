import { DashboardHeader } from "@/components/organisms/DashboardHeader";

interface HomePageProps {
  email: string;
  isAdmin: boolean;
}

export function HomePage({ email, isAdmin }: HomePageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader email={email} isAdmin={isAdmin} />
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Welkom bij Trainingslijnen
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Dit is het startpunt voor het beheren van trainingslijnen. De app
            gebruikt tijdelijke inloggegevens via environment variables. Later
            kun je overschakelen naar Microsoft Entra ID zonder de rest van de
            architectuur te wijzigen.
          </p>
        </div>
      </main>
    </div>
  );
}
