"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { bevestigEmail } from "@/services/account-client";

type Stand = "bezig" | "gelukt" | "mislukt";

export function VerificatieCard() {
  const token = useSearchParams().get("token");
  const [stand, setStand] = useState<Stand>("bezig");
  const [melding, setMelding] = useState("");

  useEffect(() => {
    if (!token) {
      setStand("mislukt");
      setMelding(
        "Deze link is onvolledig. Plak hem in zijn geheel uit de mail.",
      );
      return;
    }

    let afgebroken = false;
    bevestigEmail(token)
      .then(() => {
        if (!afgebroken) setStand("gelukt");
      })
      .catch((error: unknown) => {
        if (afgebroken) return;
        setStand("mislukt");
        setMelding(
          error instanceof Error ? error.message : "Bevestigen is mislukt.",
        );
      });

    return () => {
      afgebroken = true;
    };
  }, [token]);

  return (
    <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg" />
        <div>
          <h1 className="text-lg font-bold text-slate-900">Ontwikkelpaden</h1>
          <p className="text-xs text-slate-500">E-mailadres bevestigen</p>
        </div>
      </div>

      {stand === "bezig" && (
        <p className="text-sm text-slate-600">Bezig met bevestigen...</p>
      )}

      {stand === "gelukt" && (
        <>
          <p className="text-sm text-slate-700">
            Gelukt! Je e-mailadres is bevestigd. Je kunt nu inloggen met het
            wachtwoord dat je hebt gekozen.
          </p>
          <Link
            href="/login"
            className="mt-4 block w-full text-center bg-blue-600 text-white rounded-lg py-2 text-sm font-medium"
          >
            Naar inloggen
          </Link>
        </>
      )}

      {stand === "mislukt" && (
        <>
          <p className="text-sm text-red-600">{melding}</p>
          <Link
            href="/login"
            className="mt-4 block text-sm text-blue-600 underline"
          >
            Terug naar inloggen
          </Link>
        </>
      )}
    </div>
  );
}
