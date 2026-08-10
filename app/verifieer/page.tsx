import { Suspense } from "react";
import { VerificatieCard } from "@/components/organisms/VerificatieCard";

export default function VerifieerPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Suspense fallback={<p className="text-sm text-slate-600">Laden...</p>}>
        <VerificatieCard />
      </Suspense>
    </div>
  );
}
