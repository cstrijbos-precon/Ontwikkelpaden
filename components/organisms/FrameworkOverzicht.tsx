"use client";

import { useState } from "react";
import { berekenNiveau } from "@/lib/bereken-niveau";
import { COMPS } from "@/lib/data/competenties";
import { PAD_IDS, PADEN } from "@/lib/data/paden";
import { getPadColor } from "@/lib/pad-colors";
import { sterSym } from "@/lib/star-display";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface FrameworkOverzichtProps {
  state: OntwikkelpadenState;
}

export function FrameworkOverzicht({ state }: FrameworkOverzichtProps) {
  const [openPads, setOpenPads] = useState<Set<string>>(new Set());
  const [fwOpen, setFwOpen] = useState(false);

  const togglePad = (padId: string) => {
    setOpenPads((prev) => {
      const next = new Set(prev);
      if (next.has(padId)) next.delete(padId);
      else next.add(padId);
      return next;
    });
  };

  return (
    <div className="toolbox-wrap" style={{ marginBottom: 20 }}>
      <button
        type="button"
        className="toolbox-hdr"
        style={{ background: "var(--blauw-mid)" }}
        onClick={() => setFwOpen(!fwOpen)}
      >
        📊 Framework overzicht – sterren per niveau per pad{" "}
        <span>{fwOpen ? "▲" : "▼"}</span>
      </button>
      {fwOpen && (
        <div style={{ background: "#fff", padding: 0 }}>
          {PAD_IDS.map((padId) => {
            const pad = PADEN[padId];
            const nHuidig = berekenNiveau(padId, state.scores);
            const padOpen = openPads.has(padId);
            const relevantComps = COMPS.filter(
              (c) => !c.trainerOnly || padId === "trainer",
            );

            return (
              <div
                key={padId}
                style={{ borderBottom: "1px solid var(--grijs-lijn)" }}
              >
                <button
                  type="button"
                  style={{
                    background: "var(--grijs-bg)",
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                  }}
                  onClick={() => togglePad(padId)}
                >
                  <span
                    style={{
                      fontWeight: "bold",
                      color: getPadColor(padId),
                      fontSize: 13,
                    }}
                  >
                    {pad.label}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--grijs-licht)" }}>
                    {nHuidig > 0
                      ? `Huidig: niveau ${nHuidig} – ${pad.rollen[nHuidig - 1]}`
                      : "Nog niet ingeschaald"}{" "}
                    {padOpen ? "▲" : "▼"}
                  </span>
                </button>
                {padOpen && (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 12,
                      }}
                    >
                      <thead>
                        <tr style={{ background: getPadColor(padId) }}>
                          <th
                            style={{
                              color: "#fff",
                              padding: "8px 12px",
                              textAlign: "left",
                              width: 140,
                            }}
                          >
                            Niveau / Rol
                          </th>
                          {relevantComps.map((c) => (
                            <th
                              key={c.id}
                              style={{
                                color: "#fff",
                                padding: "8px 12px",
                                textAlign: "center",
                              }}
                            >
                              {c.label}
                            </th>
                          ))}
                          <th
                            style={{
                              color: "#fff",
                              padding: "8px 12px",
                              textAlign: "center",
                            }}
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[5, 4, 3, 2, 1].map((niv) => {
                          const v = pad.vereisten[niv - 1];
                          if (!v) return null;
                          const behaald = nHuidig >= niv;
                          const isHuidig = nHuidig === niv;
                          const rowBg = isHuidig
                            ? "#fff9f0"
                            : behaald
                              ? "#f0faf4"
                              : "#fff";

                          return (
                            <tr
                              key={niv}
                              style={{
                                background: rowBg,
                                borderBottom: "1px solid var(--grijs-lijn)",
                              }}
                            >
                              <td
                                style={{
                                  padding: "8px 12px",
                                  fontWeight: isHuidig ? "bold" : "normal",
                                  color: isHuidig
                                    ? getPadColor(padId)
                                    : "inherit",
                                }}
                              >
                                {isHuidig ? "▶ " : behaald ? "✓ " : ""}
                                {niv}. {pad.rollen[niv - 1]}
                              </td>
                              {relevantComps.map((c) => {
                                const vSter = v[c.id] ?? 0;
                                const hSter = state.scores[c.id] ?? 0;
                                const ok = hSter >= vSter;
                                return (
                                  <td
                                    key={c.id}
                                    style={{
                                      padding: "8px 12px",
                                      textAlign: "center",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: isHuidig
                                          ? ok
                                            ? "var(--groen)"
                                            : "var(--oranje)"
                                          : "#888",
                                        fontSize: 13,
                                      }}
                                    >
                                      {sterSym(vSter)}
                                    </span>
                                  </td>
                                );
                              })}
                              <td
                                style={{
                                  padding: "8px 12px",
                                  textAlign: "center",
                                  fontSize: 11,
                                }}
                              >
                                {isHuidig ? (
                                  <span
                                    style={{
                                      background: "var(--oranje)",
                                      color: "#fff",
                                      padding: "2px 8px",
                                      borderRadius: 10,
                                    }}
                                  >
                                    Huidig
                                  </span>
                                ) : behaald ? (
                                  <span
                                    style={{
                                      background: "var(--groen)",
                                      color: "#fff",
                                      padding: "2px 8px",
                                      borderRadius: 10,
                                    }}
                                  >
                                    ✓ Behaald
                                  </span>
                                ) : (
                                  <span style={{ color: "var(--grijs-licht)" }}>
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div
                      style={{
                        padding: "10px 16px",
                        background: "var(--blauw-licht)",
                        fontSize: "11.5px",
                        color: "var(--grijs)",
                      }}
                    >
                      <strong style={{ color: "var(--blauw)" }}>
                        Jouw scores:{" "}
                      </strong>
                      {relevantComps
                        .map(
                          (c) =>
                            `${c.label}: ${sterSym(state.scores[c.id] ?? 0)}`,
                        )
                        .join(" · ")}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
