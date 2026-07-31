"use client";

import { useState } from "react";
import { respondBeoordelaarKoppeling } from "@/services/gesprekken-client";
import type { BeoordelaarRol, GesprekListItem } from "@/types/gesprekken";

interface GoedkeuringPopupProps {
  items: GesprekListItem[];
  onResolved: () => void;
}

interface Verzoek {
  gesprekId: string;
  rol: BeoordelaarRol;
  beoordelaarEmail: string;
}

function verzoekenUit(items: GesprekListItem[]): Verzoek[] {
  const verzoeken: Verzoek[] = [];
  for (const item of items) {
    if (item.hoofdbeoordelaarStatus === "in_afwachting") {
      verzoeken.push({
        gesprekId: item.id,
        rol: "hoofdbeoordelaar",
        beoordelaarEmail: item.hoofdbeoordelaar,
      });
    }
    if (item.medebeoordelaarStatus === "in_afwachting") {
      verzoeken.push({
        gesprekId: item.id,
        rol: "medebeoordelaar",
        beoordelaarEmail: item.medebeoordelaar,
      });
    }
  }
  return verzoeken;
}

const ROL_LABEL: Record<BeoordelaarRol, string> = {
  hoofdbeoordelaar: "hoofdbeoordelaar",
  medebeoordelaar: "medebeoordelaar",
};

export function GoedkeuringPopup({ items, onResolved }: GoedkeuringPopupProps) {
  const [bezigMet, setBezigMet] = useState<string | null>(null);
  const [fout, setFout] = useState("");
  const verzoeken = verzoekenUit(items);

  if (verzoeken.length === 0) return null;

  async function reageer(verzoek: Verzoek, actie: "goedkeuren" | "afwijzen") {
    const key = `${verzoek.gesprekId}-${verzoek.rol}`;
    setBezigMet(key);
    setFout("");
    try {
      await respondBeoordelaarKoppeling(verzoek.gesprekId, verzoek.rol, actie);
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
        {verzoeken.map((verzoek) => {
          const key = `${verzoek.gesprekId}-${verzoek.rol}`;
          return (
            <div
              key={key}
              style={{
                borderBottom: "1px solid var(--grijs-lijn)",
                padding: "10px 0",
              }}
            >
              <p style={{ fontSize: 13, marginBottom: 8 }}>
                <strong>{verzoek.beoordelaarEmail}</strong> wil{" "}
                {ROL_LABEL[verzoek.rol]} worden van jouw functioneringsgesprek.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-v"
                  disabled={bezigMet === key}
                  onClick={() => reageer(verzoek, "goedkeuren")}
                >
                  Goedkeuren
                </button>
                <button
                  type="button"
                  className="btn btn-t"
                  disabled={bezigMet === key}
                  onClick={() => reageer(verzoek, "afwijzen")}
                >
                  Afwijzen
                </button>
              </div>
            </div>
          );
        })}
        {fout && (
          <p style={{ fontSize: 12, color: "var(--rood)", marginTop: 10 }}>
            {fout}
          </p>
        )}
      </div>
    </div>
  );
}
