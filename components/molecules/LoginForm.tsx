"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { MINIMALE_WACHTWOORDLENGTE } from "@/lib/registratie";
import {
  type AccountStatus,
  haalAccountStatus,
  maakAccount,
} from "@/services/account-client";

type Stap = "email" | "inloggen" | "registreren";

export function LoginForm() {
  const [stap, setStap] = useState<Stap>("email");
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [herhaling, setHerhaling] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function terugNaarEmail() {
    setStap("email");
    setStatus(null);
    setPassword("");
    setHerhaling("");
    setCode("");
    setError("");
  }

  async function controleerEmail() {
    if (!email.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      const gevonden = await haalAccountStatus(email);
      setStatus(gevonden);

      if (!gevonden.bekend && !gevonden.registrerenMogelijk) {
        setError(
          "Dit adres is nog niet bekend. Neem contact op met je manager.",
        );
        return;
      }
      setStap(gevonden.bekend ? "inloggen" : "registreren");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis.");
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Onjuist wachtwoord.");
      return false;
    }
    router.push("/");
    router.refresh();
    return true;
  }

  async function handleInloggen() {
    if (!password || loading) return;
    setLoading(true);
    setError("");
    await login();
    setLoading(false);
  }

  async function handleRegistreren() {
    if (!password || loading) return;

    if (password !== herhaling) {
      setError("De twee wachtwoorden zijn niet gelijk.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await maakAccount(email, password, code || undefined);
      await login();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis.");
    } finally {
      setLoading(false);
    }
  }

  if (stap === "email") {
    return (
      <div className="space-y-3">
        <Input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && controleerEmail()}
          autoComplete="email"
          autoFocus
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={controleerEmail} disabled={loading} className="w-full">
          {loading ? "Bezig..." : "Verder"}
        </Button>
        <p className="text-xs text-slate-500">
          Nog geen account? Vul je werkadres in — je kiest dan meteen een
          wachtwoord.
        </p>
      </div>
    );
  }

  const registreren = stap === "registreren";

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-slate-700 truncate">{email}</span>
        <button
          type="button"
          onClick={terugNaarEmail}
          className="text-xs text-blue-600 underline shrink-0"
        >
          wijzigen
        </button>
      </div>

      {registreren && (
        <p className="text-sm text-slate-600">
          Welkom! Dit adres is nog niet bekend. Bedenk een wachtwoord om je
          account aan te maken.
        </p>
      )}

      <Input
        type="password"
        placeholder={registreren ? "Kies een wachtwoord" : "Wachtwoord"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) =>
          e.key === "Enter" &&
          (registreren ? handleRegistreren() : handleInloggen())
        }
        autoComplete={registreren ? "new-password" : "current-password"}
        autoFocus
      />

      {registreren && (
        <>
          <Input
            type="password"
            placeholder="Herhaal het wachtwoord"
            value={herhaling}
            onChange={(e) => setHerhaling(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRegistreren()}
            autoComplete="new-password"
          />
          {status?.codeNodig && (
            <Input
              type="text"
              placeholder="Registratiecode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegistreren()}
            />
          )}
          <p className="text-xs text-slate-500">
            Minstens {MINIMALE_WACHTWOORDLENGTE} tekens, met een letter en een
            cijfer. Bewaar het goed: je kunt het later niet zelf wijzigen.
          </p>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        onClick={registreren ? handleRegistreren : handleInloggen}
        disabled={loading}
        className="w-full"
      >
        {loading
          ? "Bezig..."
          : registreren
            ? "Account aanmaken en inloggen"
            : "Inloggen"}
      </Button>
    </div>
  );
}
