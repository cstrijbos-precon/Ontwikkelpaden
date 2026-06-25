import { berekenNiveau } from "@/lib/bereken-niveau";
import { COMPS } from "@/lib/data/competenties";
import { PADEN } from "@/lib/data/paden";
import { sterSym } from "@/lib/star-display";
import type { OntwikkelpadenState, PadId } from "@/types/ontwikkelpaden";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

export function exportWord(state: OntwikkelpadenState): void {
  const naam = state.naam || "Medewerker";
  const datum = state.datum || new Date().toLocaleDateString("nl-NL");

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body{font-family:Arial,sans-serif;font-size:11pt;color:#333;max-width:800px;margin:0 auto;padding:20px}
    h1{color:#003366;font-size:18pt;border-bottom:3px solid #E87722;padding-bottom:8px}
    h2{color:#003366;font-size:14pt;margin-top:24px;border-bottom:1px solid #dde3ea;padding-bottom:4px}
    h3{color:#E87722;font-size:12pt;margin-top:16px}
    .meta{background:#e8f0f8;padding:12px;border-radius:4px;margin:16px 0;font-size:10pt}
    .meta-rij{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .veld p{border:1px solid #dde3ea;padding:8px;border-radius:4px;min-height:30px;margin:2px 0 10px}
    table{width:100%;border-collapse:collapse;margin:12px 0}
    td,th{border:1px solid #dde3ea;padding:8px;font-size:10pt}
    th{background:#003366;color:#fff;font-weight:bold}
    tr:nth-child(even){background:#f4f6f9}
    .vakexpert{color:#7B1D2A}.adviseur{color:#1D6B3A}.leider{color:#1A3A6B}.trainer{color:#6B4A1A}
    .kader{border:1.5px solid #003366;padding:10px;border-radius:4px;margin:8px 0}
    .kader-titel{font-style:italic;font-weight:bold;color:#003366;margin-bottom:6px;font-size:10pt}
    ul{margin:4px 0;padding-left:20px}
    li{font-size:10pt;margin:2px 0}
    .footer{margin-top:40px;border-top:1px solid #dde3ea;padding-top:16px;font-size:9pt;color:#666}
    .sign-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:20px}
    .sign-box{border-top:1px solid #333;padding-top:6px;font-size:9pt}
  </style></head><body>
  <h1>Précon persoonlijke ontwikkelpaden</h1>
  <div class="meta">
    <div class="meta-rij">
      <div><strong>Naam:</strong> ${escapeHtml(naam)}</div>
      <div><strong>Bij Précon sinds:</strong> ${escapeHtml(state.bijPreconSinds) || "—"}</div>
      <div><strong>Datum gesprek:</strong> ${escapeHtml(datum)}</div>
      <div><strong>Datum vorig gesprek:</strong> ${escapeHtml(state.datumVorig) || "—"}</div>
      <div><strong>Hoofdbeoordelaar:</strong> ${escapeHtml(state.hoofdbeoordelaar) || "—"}</div>
      <div><strong>Medebeoordelaar:</strong> ${escapeHtml(state.medebeoordelaar) || "—"}</div>
    </div>
  </div>`;

  if (state.hoeGaatHet || state.werkdruk || state.kernwaarden) {
    html += `<h2>Hoe gaat het?</h2>`;
    if (state.hoeGaatHet)
      html += `<h3>Hoe gaat het</h3><div class="veld"><p>${nl(state.hoeGaatHet)}</p></div>`;
    if (state.werkdruk)
      html += `<h3>Werkdruk</h3><div class="veld"><p>${nl(state.werkdruk)}</p></div>`;
    if (state.kernwaarden)
      html += `<h3>Kernwaarden</h3><div class="veld"><p>${nl(state.kernwaarden)}</p></div>`;
  }

  const sitFilled = state.situaties.filter((s) => s.trim());
  if (sitFilled.length) {
    html += `<h2>Praktijksituaties</h2>`;
    state.situaties.forEach((s, i) => {
      if (s.trim())
        html += `<h3>Situatie ${i + 1}</h3><div class="veld"><p>${nl(s)}</p></div>`;
    });
    if (state.impact)
      html += `<h3>Overige resultaten</h3><div class="veld"><p>${nl(state.impact)}</p></div>`;
    if (state.declarabiliteit)
      html += `<h3>Declarabiliteit</h3><div class="veld"><p>${nl(state.declarabiliteit)}</p></div>`;
  }

  if (state.profiel)
    html += `<h2>Jouw profiel</h2><div class="veld"><p>${nl(state.profiel)}</p></div>`;

  html += `<h2>Competentiescores</h2>
  <table><tr><th>Competentie</th><th>Score</th><th>Toelichting</th></tr>
  ${COMPS.map(
    (c) =>
      `<tr><td>${c.label}</td><td>${sterSym(state.scores[c.id])}</td><td>${escapeHtml(state.opmerkingen[c.id]) || "—"}</td></tr>`,
  ).join("")}
  </table>`;

  html += `<h2>Positie op de ontwikkelpaden</h2>
  <table><tr><th>Pad</th><th>Vorig jaar</th><th>Huidig niveau</th><th>Ambitie</th><th>Trainingsgroep</th></tr>
  ${(Object.entries(PADEN) as [PadId, (typeof PADEN)[PadId]][])
    .map(([padId, pad]) => {
      const n = berekenNiveau(padId, state.scores);
      const vj = state.vorigJaar[padId];
      const amb = state.ambities[padId];
      return `<tr>
      <td class="${padId}"><strong>${pad.label}</strong></td>
      <td>${vj > 0 ? `Niveau ${vj} – ${pad.rollen[vj - 1]}` : "—"}</td>
      <td>${n > 0 ? `Niveau ${n} – ${pad.rollen[n - 1]}` : "Niet ingeschaald"}</td>
      <td>${amb && n < 5 ? `Niveau ${n + 1} – ${pad.rollen[n]}` : "—"}</td>
      <td>${escapeHtml(state.trainingsgroepen[padId]) || "—"}</td>
    </tr>`;
    })
    .join("")}
  </table>`;

  if (state.tDiepte || state.tBreedte) {
    html += `<h2>T-profiel</h2>`;
    if (state.tDiepte)
      html += `<p><strong>Diepte (expertise):</strong> ${escapeHtml(state.tDiepte)}</p>`;
    if (state.tBreedte)
      html += `<p><strong>Breedte (kennis van):</strong> ${escapeHtml(state.tBreedte)}</p>`;
  }

  if (state.ambitieNotitie)
    html += `<h2>Ambitie</h2><div class="veld"><p>${nl(state.ambitieNotitie)}</p></div>`;

  html += `<h2>Ontwikkeling & POP</h2>`;
  (Object.entries(PADEN) as [PadId, (typeof PADEN)[PadId]][]).forEach(
    ([padId, pad]) => {
      const n = berekenNiveau(padId, state.scores);
      const amb = state.ambities[padId];
      const doelN = amb && n < 5 ? n + 1 : null;
      if (!amb && n === 0) return;

      html += `<h3 class="${padId}">${pad.label}${doelN ? ` → ambitie: niveau ${doelN} – ${pad.rollen[doelN - 1]}` : ""}</h3>`;
      if (doelN && pad.toolboxen[doelN]) {
        const tb = pad.toolboxen[doelN];
        html += `<div class="kader"><div class="kader-titel">Toolbox voor niveau ${doelN}: ${pad.rollen[doelN - 1]}</div>`;
        if (tb.vereist?.length)
          html += `<p><strong>Vereist:</strong></p><ul>${tb.vereist.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
        if (tb.zelfDoen?.length)
          html += `<p><strong>Zelf doen:</strong></p><ul>${tb.zelfDoen.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
        if (tb.collega?.length)
          html += `<p><strong>Leren van collega's:</strong></p><ul>${tb.collega.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
        if (tb.trainingen?.length)
          html += `<p><strong>Trainingen:</strong></p><ul>${tb.trainingen.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
        html += `</div>`;
      }
    },
  );

  if (state.toolboxKeuze)
    html += `<h3>Wat ik ga doen</h3><div class="veld"><p>${nl(state.toolboxKeuze)}</p></div>`;
  if (state.checkpoints)
    html += `<h3>Checkpoints</h3><div class="veld"><p>${nl(state.checkpoints)}</p></div>`;
  if (state.tProfielOntwikkeling)
    html += `<h3>T-profiel ontwikkeling</h3><div class="veld"><p>${nl(state.tProfielOntwikkeling)}</p></div>`;

  if (state.overigeAfspraken)
    html += `<h2>Overige afspraken</h2><div class="veld"><p>${nl(state.overigeAfspraken)}</p></div>`;
  if (state.datumVolgend)
    html += `<p><strong>Datum volgend gesprek:</strong> ${escapeHtml(state.datumVolgend)}</p>`;

  html += `<div class="footer">
    <div class="sign-grid">
      <div class="sign-box">Professional: ${escapeHtml(naam)}</div>
      <div class="sign-box">Hoofdbeoordelaar: ${escapeHtml(state.hoofdbeoordelaar) || "___________"}</div>
      <div class="sign-box">Medebeoordelaar: ${escapeHtml(state.medebeoordelaar) || "___________"}</div>
    </div>
    <p style="margin-top:12px">Na ondertekening per mail doorsturen naar evankouwen@precongroup.com</p>
  </div>
  </body></html>`;

  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Précon_Ontwikkelpad_${naam.replace(/\s+/g, "_")}_${datum}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
