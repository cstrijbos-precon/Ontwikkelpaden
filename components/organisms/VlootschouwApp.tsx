"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { VlootschouwFrameworkGrid } from "@/components/organisms/VlootschouwFrameworkGrid";
import { VlootschouwPlanningGrid } from "@/components/organisms/VlootschouwPlanningGrid";
import { useVlootschouw } from "@/hooks/useVlootschouw";
import { WERELDEN } from "@/lib/data/werelden";
import { padenVoor, padIdsVoor, variantVan } from "@/lib/variant";
import { reactiePerPad, type WereldFilter } from "@/lib/vlootschouw/aggregatie";

type Tab = "vlootschouw" | "planning";

export default function VlootschouwApp() {
  const { data: session } = useSession();
  const { overzicht, hydrated, loadError, saveError, wijzigPlanningCel } =
    useVlootschouw();
  const [tab, setTab] = useState<Tab>("vlootschouw");
  const [wereldFilter, setWereldFilter] = useState<WereldFilter>("totaal");

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

  // Hoe groter het deel van de populatie dat al is ingeschaald, hoe meer de
  // verdeling zegt. Bij een lage reactie is het een indicatie, geen uitkomst.
  const variant = variantVan(wereldFilter);
  const reacties = padIdsVoor(variant)
    .map((padId) => ({
      padId,
      ...reactiePerPad(overzicht.rollen, padId, wereldFilter),
    }))
    .filter((r) => r.pct !== null);
  const laagsteReactie = reacties.reduce<(typeof reacties)[number] | null>(
    (laagste, r) =>
      laagste === null || (r.pct ?? 0) < (laagste.pct ?? 0) ? r : laagste,
    null,
  );

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
        <div className="scherm">
          <div className="scherm-titel">Wat hebben we nodig?</div>
          <div className="scherm-sub">
            Per niveau zie je welk deel van de ingeschaalde mensen daar nu zit
            (live uit de FG-gesprekken), naast het deel dat er volgens jouw norm
            zou moeten zitten. Zo vergelijk je de verdeling, ook als nog niet
            iedereen een gesprek heeft ingevuld. Vul in hoeveel er nu en straks
            nodig zijn.
          </div>
          {wereldFilter === "totaal" ? (
            <p className="plan-hint">
              Je ziet nu de totalen over alle werelden. Kies hierboven een
              wereld om cijfers in te vullen.
            </p>
          ) : (
            <p className="plan-hint">
              Je vult de cijfers in voor <strong>{wereldFilter}</strong>.
              Wijzigingen worden direct opgeslagen.
            </p>
          )}
          {laagsteReactie !== null && (laagsteReactie.pct ?? 100) < 50 && (
            <p className="plan-hint">
              Let op: bij {padenVoor(variant)[laagsteReactie.padId].label} is
              pas {laagsteReactie.pct}% van de populatie ingeschaald (
              {laagsteReactie.ingeschaald} van {laagsteReactie.nodig}). Lees de
              verdeling daarom als indicatie.
            </p>
          )}
          <div style={{ overflowX: "auto" }}>
            <VlootschouwPlanningGrid
              rollen={overzicht.rollen}
              wereldFilter={wereldFilter}
              onWijzig={wijzigPlanningCel}
            />
          </div>
        </div>
      )}
    </>
  );
}
