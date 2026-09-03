"use client";

import { useState } from "react";
import {
  respondBeoordelaarKoppeling,
  respondHoofdbeoordelaarKoppeling,
} from "@/services/gesprekken-client";
import type { GesprekListItem } from "@/types/gesprekken";

interface GoedkeuringPopupProps {
  items: GesprekListItem[];
  /** E-mailadres van wie vraagt om al je verslagen te mogen inzien. */
  pendingHoofdbeoordelaar?: string | null;
  onResolved: () => void;
}

/**
 * Medebeoordelaar geldt alleen voor het gesprek waar iemand aan toegevoegd
 * is; die vraag hoort dus bij het gesprek. Hoofdbeoordelaar is een
 * doorlopende relatie — goedkeuren daarvan geeft toegang tot al je
 * verslagen, nu en in de toekomst — en krijgt daarom een eigen kaart met
 * eigen tekst, los van welk gesprek de aanvraag toevallig deed ontstaan.
 */
interface MedebeoordelaarVerzoek {
  soort: "medebeoordelaar";
  key: string;
  gesprekId: string;
  beoordelaarEmail: string;
}

interface HoofdbeoordelaarVerzoek {
  soort: "hoofdbeoordelaar";
  key: string;
  beoordelaarEmail: string;
}

type Verzoek = MedebeoordelaarVerzoek | HoofdbeoordelaarVerzoek;

function verzoekenUit(
  items: GesprekListItem[],
  pendingHoofdbeoordelaar: string | null | undefined,
): Verzoek[] {
  const verzoeken: Verzoek[] = [];
  if (pendingHoofdbeoordelaar) {
    verzoeken.push({
      soort: "hoofdbeoordelaar",
      key: "hoofdbeoordelaar",
      beoordelaarEmail: pendingHoofdbeoordelaar,
    });
  }
  for (const item of items) {
    if (item.medebeoordelaarStatus === "in_afwachting") {
      verzoeken.push({
        soort: "medebeoordelaar",
        key: `${item.id}-medebeoordelaar`,
        gesprekId: item.id,
        beoordelaarEmail: item.medebeoordelaar,
      });
    }
  }
  return verzoeken;
}

export function GoedkeuringPopup({
  items,
  pendingHoofdbeoordelaar,
  onResolved,
}: GoedkeuringPopupProps) {
  const [bezigMet, setBezigMet] = useState<string | null>(null);
  const [fout, setFout] = useState("");
  const verzoeken = verzoekenUit(items, pendingHoofdbeoordelaar);

  if (verzoeken.length === 0) return null;

  async function reageer(verzoek: Verzoek, actie: "goedkeuren" | "afwijzen") {
    setBezigMet(verzoek.key);
    setFout("");
    try {
      if (verzoek.soort === "hoofdbeoordelaar") {
        await respondHoofdbeoordelaarKoppeling(actie);
      } else {
        await respondBeoordelaarKoppeling(
          verzoek.gesprekId,
          "medebeoordelaar",
          actie,
        );
      }
      onResolved();
    } catch (error) {
      setFout(error instanceof Error ? error.message : "Actie mislukt");
    } finally {
      setBezigMet(null);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <p
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: "var(--blauw)",
            marginBottom: 12,
          }}
        >
          Openstaande koppelingsverzoeken
        </p>
        {verzoeken.map((verzoek) => (
          <div
            key={verzoek.key}
            style={{
              borderBottom: "1px solid var(--grijs-lijn)",
              padding: "10px 0",
            }}
          >
            <p style={{ fontSize: 13, marginBottom: 8 }}>
              <strong>{verzoek.beoordelaarEmail}</strong>{" "}
              {verzoek.soort === "hoofdbeoordelaar"
                ? "wil als hoofdbeoordelaar al jouw functioneringsgesprekken kunnen inzien — dit jaar, maar ook oudere en toekomstige gesprekken."
                : "wil medebeoordelaar worden van jouw huidige functioneringsgesprek."}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-v"
                disabled={bezigMet === verzoek.key}
                onClick={() => reageer(verzoek, "goedkeuren")}
              >
                Goedkeuren
              </button>
              <button
                type="button"
                className="btn btn-t"
                disabled={bezigMet === verzoek.key}
                onClick={() => reageer(verzoek, "afwijzen")}
              >
                Afwijzen
              </button>
            </div>
          </div>
        ))}
        {fout && (
          <p style={{ fontSize: 12, color: "var(--rood)", marginTop: 10 }}>
            {fout}
          </p>
        )}
      </div>
    </div>
  );
}
