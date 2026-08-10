"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { AccountBeheer } from "@/components/organisms/AccountBeheer";
import { GoedkeuringPopup } from "@/components/organisms/GoedkeuringPopup";
import { mergeWithInitialState } from "@/lib/initial-state";
import {
  createGesprek,
  fetchBekendeMedewerkers,
  fetchDashboard,
  fetchKnownUserEmails,
  importGesprekDocx,
  koppelBeoordelaar,
} from "@/services/gesprekken-client";
import type {
  BekendeMedewerker,
  BeoordelaarRol,
  DashboardOverzicht,
  GesprekListItem,
} from "@/types/gesprekken";

const STATUS_LABEL: Record<GesprekListItem["status"], string> = {
  draft: "Concept",
  completed: "Afgerond",
  archived: "Gearchiveerd",
};

interface RubriekProps {
  titel: string;
  items: GesprekListItem[];
  statusVeld: "hoofdbeoordelaarStatus" | "medebeoordelaarStatus" | null;
  scherm?: number;
  bekendeMedewerkers?: BekendeMedewerker[];
  onToevoegen?: (email: string) => Promise<void>;
}

function Rubriek({
  titel,
  items,
  statusVeld,
  scherm,
  bekendeMedewerkers,
  onToevoegen,
}: RubriekProps) {
  const [gekozenEmail, setGekozenEmail] = useState("");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  return (
    <div className="scherm" style={{ marginBottom: 20 }}>
      <div className="sk">{titel}</div>
      {items.length === 0 && (
        <p style={{ fontSize: 12, color: "var(--grijs-licht)" }}>
          Nog geen gesprekken.
        </p>
      )}
      {items.map((item) => {
        const wachtend = statusVeld
          ? item[statusVeld] === "in_afwachting"
          : false;
        const label = `${item.medewerkerNaam || item.medewerkerEmail || "onbekend"} — ${item.gesprekDatum ?? "geen datum"}`;
        const href =
          item.status === "archived"
            ? `/gesprekken/${item.id}`
            : `/gesprekken/${item.id}/bewerken${scherm !== undefined ? `?scherm=${scherm}` : ""}`;

        return (
          <div key={item.id} className="dashboard-rij">
            {wachtend ? (
              <span style={{ color: "var(--grijs-licht)" }}>{label}</span>
            ) : (
              <Link href={href}>{label}</Link>
            )}
            <span style={{ display: "flex", gap: 6 }}>
              <span className="badge">{STATUS_LABEL[item.status]}</span>
              {wachtend && (
                <span className="badge badge-wacht">In afwachting</span>
              )}
            </span>
          </div>
        );
      })}
      {onToevoegen && bekendeMedewerkers && (
        <>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            {/* Een lijst met suggesties, geen keurslijf: je kunt ook een adres
                intypen van iemand die nog nooit heeft ingelogd. */}
            <input
              list="bekende-medewerkers"
              type="email"
              value={gekozenEmail}
              onChange={(e) => setGekozenEmail(e.target.value)}
              placeholder="Kies of typ een e-mailadres..."
              style={{ flex: 1 }}
            />
            <datalist id="bekende-medewerkers">
              {bekendeMedewerkers.map((m) => (
                <option key={m.email} value={m.email}>
                  {m.naam}
                </option>
              ))}
            </datalist>
            <button
              type="button"
              className="btn btn-t"
              disabled={!gekozenEmail || bezig}
              onClick={async () => {
                setBezig(true);
                setFout("");
                try {
                  await onToevoegen(gekozenEmail);
                  setGekozenEmail("");
                } catch (error) {
                  setFout(
                    error instanceof Error
                      ? error.message
                      : "Toevoegen mislukt",
                  );
                } finally {
                  setBezig(false);
                }
              }}
            >
              + Medewerker toevoegen
            </button>
          </div>
          {fout && (
            <p style={{ fontSize: 11, color: "var(--rood)", marginTop: 6 }}>
              {fout}
            </p>
          )}
          <p
            style={{
              fontSize: 11,
              color: "var(--grijs-licht)",
              marginTop: 6,
            }}
          >
            Heeft de collega nog geen gesprek, dan wordt er meteen een concept
            aangemaakt. Heeft diegene nog nooit ingelogd, dan kun je er direct
            in werken; zodra hij of zij zelf een account maakt, staat het
            gesprek klaar. Bestaat het account al, dan moet de koppeling nog
            worden goedgekeurd.
          </p>
        </>
      )}
    </div>
  );
}

export function Dashboard() {
  const { data: session } = useSession();
  const [overzicht, setOverzicht] = useState<DashboardOverzicht | null>(null);
  const [medewerkers, setMedewerkers] = useState<BekendeMedewerker[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [foutmelding, setFoutmelding] = useState("");
  const [importBezig, setImportBezig] = useState(false);

  const laad = useCallback(async () => {
    const [dash, meds, accountEmails] = await Promise.all([
      fetchDashboard(),
      fetchBekendeMedewerkers(),
      // Accounts zonder gesprek staan niet in `meds`; zonder deze lijst kun je
      // voor hen ook geen gesprek starten.
      fetchKnownUserEmails().catch(() => [] as string[]),
    ]);
    const bekend = new Set(meds.map((m) => m.email.toLowerCase()));
    const zonderGesprek = accountEmails
      .filter((email) => !bekend.has(email.toLowerCase()))
      .map((email) => ({ naam: email, email }));

    setOverzicht(dash);
    setMedewerkers([...meds, ...zonderGesprek]);
    setFoutmelding("");
  }, []);

  useEffect(() => {
    laad()
      .catch((error) => {
        setFoutmelding(
          error instanceof Error ? error.message : "Kon dashboard niet laden.",
        );
      })
      .finally(() => setHydrated(true));
  }, [laad]);

  const sessionEmail = session?.user?.email?.toLowerCase() ?? null;

  async function handleImport(file: File) {
    setImportBezig(true);
    setFoutmelding("");
    try {
      const result = await importGesprekDocx(file);
      if (!sessionEmail) throw new Error("Niet ingelogd");
      const state = mergeWithInitialState(result.state);
      await createGesprek(state, {
        medewerkerEmail: sessionEmail,
        status: "archived",
      });
      await laad();
    } catch (error) {
      setFoutmelding(
        error instanceof Error ? error.message : "Importeren mislukt",
      );
    } finally {
      setImportBezig(false);
    }
  }

  async function koppel(rol: BeoordelaarRol, email: string) {
    await koppelBeoordelaar(email, rol);
    await laad();
  }

  if (!hydrated) {
    return (
      <div className="scherm" style={{ textAlign: "center", padding: 48 }}>
        Laden...
      </div>
    );
  }

  if (!overzicht) {
    return (
      <div className="scherm" style={{ textAlign: "center", padding: 48 }}>
        <p>Kon het dashboard niet laden.</p>
        <p style={{ color: "var(--grijs-licht)", marginTop: 8 }}>
          {foutmelding}
        </p>
        <button
          type="button"
          className="btn btn-t"
          style={{ marginTop: 16 }}
          onClick={() => {
            setHydrated(false);
            laad()
              .catch((error) => {
                setFoutmelding(
                  error instanceof Error
                    ? error.message
                    : "Kon dashboard niet laden.",
                );
              })
              .finally(() => setHydrated(true));
          }}
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  const medewerkersVoorDropdown = medewerkers.filter(
    (m) => m.email.toLowerCase() !== sessionEmail,
  );
  const huidigeEigen = overzicht.eigen.find((g) => g.status !== "archived");

  return (
    <>
      {overzicht.pendingGoedkeuringen.length > 0 && (
        <GoedkeuringPopup
          items={overzicht.pendingGoedkeuringen}
          onResolved={laad}
        />
      )}
      <div className="header">
        <div className="header-top">
          <div className="header-logo">
            <div className="logo-box">P</div>
            <div>
              <div className="header-brand-title">Précon Consulting Group</div>
              <div className="header-brand-sub">
                Kwaliteitsmanagementsysteem · F-04
              </div>
            </div>
          </div>
          <div className="save-area">
            <Link href="/vlootschouw" className="btn btn-ghost-header">
              Vlootschouw
            </Link>
            <Link href="/verbeterplanning" className="btn btn-ghost-header">
              Verbeterplanning
            </Link>
            <span className="save-status">{session?.user?.email}</span>
            <button
              type="button"
              className="btn btn-ghost-header"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Uitloggen
            </button>
          </div>
        </div>
        <div className="header-bottom">
          <h1>Mijn dashboard</h1>
        </div>
      </div>
      <div className="scherm">
        {foutmelding && (
          <p style={{ color: "var(--rood)", marginBottom: 12 }}>
            {foutmelding}
          </p>
        )}
        <Rubriek
          titel="Eigen FG-gesprekken"
          items={overzicht.eigen}
          statusVeld={null}
        />
        <div
          className="form-rij"
          style={{ alignItems: "center", marginTop: -8 }}
        >
          {huidigeEigen && (
            <Link
              href={`/gesprekken/${huidigeEigen.id}/bewerken?scherm=8`}
              className="btn btn-t"
            >
              📘 Lopende POP
            </Link>
          )}
          <label className="btn btn-t" style={{ display: "inline-block" }}>
            {importBezig
              ? "Bezig met importeren..."
              : "📄 Importeer oud gesprek (.docx of .pdf)"}
            <input
              type="file"
              accept=".docx,.pdf"
              style={{ display: "none" }}
              disabled={importBezig}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImport(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>
      <Rubriek
        titel="Hoofdbeoordelaar van"
        items={overzicht.alsHoofdbeoordelaar}
        statusVeld="hoofdbeoordelaarStatus"
        scherm={7}
        bekendeMedewerkers={medewerkersVoorDropdown}
        onToevoegen={(email) => koppel("hoofdbeoordelaar", email)}
      />
      <Rubriek
        titel="Medebeoordelaar van"
        items={overzicht.alsMedebeoordelaar}
        statusVeld="medebeoordelaarStatus"
        scherm={7}
        bekendeMedewerkers={medewerkersVoorDropdown}
        onToevoegen={(email) => koppel("medebeoordelaar", email)}
      />
      {session?.user?.isAdmin && <AccountBeheer />}
    </>
  );
}
