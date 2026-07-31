"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { VlootschouwFrameworkGrid } from "@/components/organisms/VlootschouwFrameworkGrid";
import { useVlootschouw } from "@/hooks/useVlootschouw";
import { PADEN } from "@/lib/data/paden";
import { WERELDEN, type Wereld } from "@/lib/data/werelden";
import { getPadColor } from "@/lib/pad-colors";
import { groepeerPerPadEnWereld } from "@/lib/vlootschouw/aggregatie";
import type { RolRij } from "@/lib/vlootschouw/types";

type Tab = "vlootschouw" | "planning";

function PlanningInput({
  waarde,
  onCommit,
}: {
  waarde: number;
  onCommit: (nieuweWaarde: number) => void;
}) {
  const [draft, setDraft] = useState(String(waarde));

  return (
    <input
      type="number"
      min={0}
      value={draft}
      style={{ width: 60 }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const nieuw = Number(draft);
        if (Number.isFinite(nieuw) && nieuw >= 0 && nieuw !== waarde) {
          onCommit(Math.round(nieuw));
        } else {
          setDraft(String(waarde));
        }
      }}
    />
  );
}

function RolRijEditor({
  rij,
  onWijzig,
}: {
  rij: RolRij;
  onWijzig: (patch: { nodigNu?: number; nodigStraks?: number }) => void;
}) {
  return (
    <tr>
      <td style={{ color: getPadColor(rij.padId), fontWeight: "bold" }}>
        {PADEN[rij.padId].label}
      </td>
      <td>{rij.rolNaam}</td>
      <td>{rij.wereld}</td>
      <td>{rij.aanwezig}</td>
      <td>
        <PlanningInput
          waarde={rij.nodigNu}
          onCommit={(nodigNu) => onWijzig({ nodigNu })}
        />
      </td>
      <td>
        <PlanningInput
          waarde={rij.nodigStraks}
          onCommit={(nodigStraks) => onWijzig({ nodigStraks })}
        />
      </td>
    </tr>
  );
}

export default function VlootschouwApp() {
  const { data: session } = useSession();
  const { overzicht, hydrated, loadError, saveError, wijzigPlanningCel } =
    useVlootschouw();
  const [tab, setTab] = useState<Tab>("vlootschouw");
  const [wereldFilter, setWereldFilter] = useState<Wereld | "totaal">("totaal");

  if (!hydrated) {
    return (
      <div className="scherm" style={{ textAlign: "center", padding: 48 }}>
        Laden...
      </div>
    );
  }

  if (loadError || !overzicht) {
    return (
      <div className="scherm" style={{ textAlign: "center", padding: 48 }}>
        {loadError || "Onbekende fout bij laden."}
      </div>
    );
  }

  const padWereldRijen = groepeerPerPadEnWereld(overzicht.rollen);

  return (
    <>
      <div className="header">
        <div className="header-top">
          <div className="header-logo">
            <div className="logo-box">P</div>
            <div>
              <div className="header-brand-title">Précon Consulting Group</div>
              <div className="header-brand-sub">
                Vlootschouw &amp; strategische personeelsplanning
              </div>
            </div>
          </div>
          <div className="save-area">
            <Link href="/dashboard" className="btn btn-ghost-header">
              ← Dashboard
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
          <h1>Vlootschouw</h1>
        </div>
      </div>

      <div className="scherm" style={{ paddingBottom: 0 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: -1 }}>
          <button
            type="button"
            className={`btn ${tab === "vlootschouw" ? "btn-v" : "btn-t"}`}
            onClick={() => setTab("vlootschouw")}
          >
            Vlootschouw
          </button>
          <button
            type="button"
            className={`btn ${tab === "planning" ? "btn-v" : "btn-t"}`}
            onClick={() => setTab("planning")}
          >
            Strategische personeelsplanning
          </button>
        </div>
      </div>

      {saveError && (
        <div className="scherm" style={{ paddingTop: 0 }}>
          <p style={{ color: "var(--rood)" }}>{saveError}</p>
        </div>
      )}

      <div className="scherm" style={{ paddingBottom: 0 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className={`btn ${wereldFilter === "totaal" ? "btn-v" : "btn-t"}`}
            onClick={() => setWereldFilter("totaal")}
          >
            Totaal
          </button>
          {WERELDEN.map((wereld) => (
            <button
              key={wereld}
              type="button"
              className={`btn ${wereldFilter === wereld ? "btn-v" : "btn-t"}`}
              onClick={() => setWereldFilter(wereld)}
            >
              {wereld}
            </button>
          ))}
        </div>
      </div>

      {tab === "vlootschouw" && (
        <div className="scherm">
          <div className="scherm-titel">Waar staan we nu?</div>
          <div className="scherm-sub">
            Aantallen komen live uit de FG-gesprekken (huidig niveau per pad).
            Hoe groter de bol, hoe meer mensen op dat niveau.
          </div>
          <div style={{ overflowX: "auto" }}>
            <VlootschouwFrameworkGrid
              rollen={overzicht.rollen}
              wereldFilter={wereldFilter}
              metric="aanwezig"
            />
          </div>
        </div>
      )}

      {tab === "planning" && (
        <>
          <div className="scherm">
            <div className="scherm-titel">Wat hebben we nodig?</div>
            <div className="scherm-sub">
              Grijze bol = nodig nu, oranje bol = nu aanwezig (zelfde als bij
              Vlootschouw), overlappend in één overzicht. Een zichtbare grijze
              rand betekent een tekort; oranje die de grijze bol volledig bedekt
              betekent voldoende of een overschot. Vul de cijfers aan in de
              tabel hieronder.
            </div>
            <div style={{ overflowX: "auto" }}>
              <VlootschouwFrameworkGrid
                rollen={overzicht.rollen}
                wereldFilter={wereldFilter}
                metric="beide"
              />
            </div>
          </div>

          <div className="scherm">
            <div className="sk">Percentages per pad en wereld</div>
            <table className="venn-tabel">
              <thead>
                <tr>
                  <th>Pad</th>
                  <th>Wereld</th>
                  <th>Aanwezig</th>
                  <th>Nodig nu</th>
                  <th>Vervulling</th>
                </tr>
              </thead>
              <tbody>
                {padWereldRijen.map((rij) => (
                  <tr key={`${rij.padId}-${rij.wereld}`}>
                    <td
                      style={{
                        color: getPadColor(rij.padId),
                        fontWeight: "bold",
                      }}
                    >
                      {PADEN[rij.padId].label}
                    </td>
                    <td>{rij.wereld}</td>
                    <td>{rij.aanwezig}</td>
                    <td>{rij.nodigNu}</td>
                    <td>
                      {rij.vervullingPercentage === null
                        ? "—"
                        : `${rij.vervullingPercentage}%`}
                    </td>
                  </tr>
                ))}
                {padWereldRijen.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ color: "var(--grijs-licht)" }}>
                      Nog geen gegevens.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="scherm">
            <div className="sk">Aantallen per rol</div>
            <table className="venn-tabel">
              <thead>
                <tr>
                  <th>Pad</th>
                  <th>Rol</th>
                  <th>Wereld</th>
                  <th>Aanwezig</th>
                  <th>Nodig nu</th>
                  <th>Nodig straks</th>
                </tr>
              </thead>
              <tbody>
                {overzicht.rollen.map((rij) => (
                  <RolRijEditor
                    key={`${rij.padId}-${rij.niveau}-${rij.wereld}`}
                    rij={rij}
                    onWijzig={(patch) =>
                      wijzigPlanningCel({
                        padId: rij.padId,
                        niveau: rij.niveau,
                        wereld: rij.wereld,
                        nodigNu: patch.nodigNu ?? rij.nodigNu,
                        nodigStraks: patch.nodigStraks ?? rij.nodigStraks,
                      })
                    }
                  />
                ))}
                {overzicht.rollen.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ color: "var(--grijs-licht)" }}>
                      Nog geen gegevens — vul op scherm 1 van een FG-gesprek de
                      "Wereld" in, of voer hieronder normcijfers in.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
