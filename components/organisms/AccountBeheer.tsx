"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type AccountRegel,
  geefAccountVrij,
  haalAccounts,
} from "@/services/account-client";

function datum(waarde: string | null): string {
  if (!waarde) return "nog niet";
  return new Date(waarde).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Alleen zichtbaar voor beheerders: wachtwoord kwijt? Adres weer vrijgeven. */
export function AccountBeheer() {
  const [accounts, setAccounts] = useState<AccountRegel[]>([]);
  const [open, setOpen] = useState(false);
  const [bezigMet, setBezigMet] = useState<string | null>(null);
  const [fout, setFout] = useState("");

  const laad = useCallback(async () => {
    try {
      setAccounts(await haalAccounts());
      setFout("");
    } catch (error) {
      setFout(error instanceof Error ? error.message : "Laden mislukt");
    }
  }, []);

  useEffect(() => {
    if (open) void laad();
  }, [open, laad]);

  async function vrijgeven(email: string) {
    setBezigMet(email);
    setFout("");
    try {
      await geefAccountVrij(email);
      await laad();
    } catch (error) {
      setFout(error instanceof Error ? error.message : "Vrijgeven mislukt");
    } finally {
      setBezigMet(null);
    }
  }

  return (
    <div className="scherm" style={{ marginBottom: 20 }}>
      <button
        type="button"
        className="toolbox-hdr"
        style={{ background: "var(--blauw-mid)" }}
        onClick={() => setOpen(!open)}
      >
        🔑 Accounts en wachtwoorden <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ background: "#fff", padding: "12px 16px" }}>
          <p
            style={{ fontSize: 11.5, color: "var(--grijs)", marginBottom: 10 }}
          >
            Wachtwoord kwijt? Geef het adres vrij. De collega kiest bij de
            volgende keer inloggen zelf een nieuw wachtwoord. Gesprekken blijven
            gewoon staan.
          </p>

          {fout && (
            <p style={{ fontSize: 11, color: "var(--rood)", marginBottom: 8 }}>
              {fout}
            </p>
          )}

          {accounts.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--grijs-licht)" }}>
              Nog niemand heeft zelf een account aangemaakt.
            </p>
          ) : (
            accounts.map((account) => (
              <div key={account.email} className="dashboard-rij">
                <span style={{ fontSize: 12.5 }}>{account.email}</span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  {!account.geverifieerd && (
                    <span className="badge badge-wacht">Niet bevestigd</span>
                  )}
                  <span style={{ fontSize: 11, color: "var(--grijs-licht)" }}>
                    laatst ingelogd: {datum(account.laatstIngelogdOp)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-t"
                    disabled={bezigMet === account.email}
                    onClick={() => vrijgeven(account.email)}
                  >
                    {bezigMet === account.email
                      ? "Bezig..."
                      : "Wachtwoord vrijgeven"}
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
