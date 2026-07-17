"use client";

import { useState } from "react";
import type { VerbeterplanningBoard } from "@/lib/verbeterplanning/types";

interface VerbeterplanningExportBarProps {
  board: VerbeterplanningBoard;
  onCollapseAll: () => void;
  onRefresh: () => void;
}

function downloadJson(board: VerbeterplanningBoard) {
  const json = JSON.stringify(board, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `precon_tijdlijn_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function printTimelineOnly() {
  document.body.classList.remove("print-full");
  window.print();
}

async function addTimelineSnapshotToPdf(
  pdf: import("jspdf").jsPDF,
  opts: { margin: number; pageW: number; pageH: number; titleSuffix: string },
) {
  const html2canvas = (await import("html2canvas")).default;
  const { margin, pageW, pageH, titleSuffix } = opts;

  const target = document.getElementById("timeline");
  if (!target) return;
  const canvas = await html2canvas(target, {
    scale: 2,
    backgroundColor: "#FFFFFF",
    useCORS: true,
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  const usableW = pageW - margin * 2;
  const imgWmm = usableW;
  const imgHmm = (canvas.height * imgWmm) / canvas.width;

  pdf.setFontSize(14);
  pdf.setTextColor(0, 56, 85);
  pdf.text(
    `Précon — Verbeterplanning Tijdlijn${titleSuffix}`,
    margin,
    margin + 2,
  );
  pdf.setFontSize(8);
  pdf.setTextColor(107, 136, 153);
  const today = new Date().toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  pdf.text(`Gegenereerd op ${today}`, margin, margin + 7);

  const contentTop = margin + 12;
  const availH = pageH - contentTop - margin;

  if (imgHmm <= availH) {
    pdf.addImage(imgData, "JPEG", margin, contentTop, imgWmm, imgHmm);
    return;
  }

  const pxPerMm = canvas.width / imgWmm;
  const pageContentPx = Math.floor(availH * pxPerMm);
  let renderedPx = 0;
  let pageIndex = 0;

  while (renderedPx < canvas.height) {
    if (pageIndex > 0) pdf.addPage();
    const sliceHeightPx = Math.min(pageContentPx, canvas.height - renderedPx);

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeightPx;
    const ctx = sliceCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        renderedPx,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx,
      );
    }

    const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
    const sliceHmm = (sliceHeightPx * imgWmm) / canvas.width;
    const top = pageIndex === 0 ? contentTop : margin;
    pdf.addImage(sliceData, "JPEG", margin, top, imgWmm, sliceHmm);

    renderedPx += sliceHeightPx;
    pageIndex++;
  }
}

export default function VerbeterplanningExportBar({
  board,
  onCollapseAll,
  onRefresh,
}: VerbeterplanningExportBarProps) {
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);

  async function downloadPdf(withComments: boolean) {
    setPdfBusy(
      withComments
        ? "PDF (met opmerkingen) wordt gemaakt…"
        : "PDF (tijdlijn) wordt gemaakt…",
    );
    try {
      onCollapseAll();
      document.body.classList.add("pdf-export-mode");
      document.body.classList.remove("pdf-with-comments");
      await new Promise((r) => setTimeout(r, 150));

      const { jsPDF } = await import("jspdf");
      const margin = 8;
      const pageW = 297;
      const pageH = 210;
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      await addTimelineSnapshotToPdf(pdf, {
        margin,
        pageW,
        pageH,
        titleSuffix: "",
      });

      if (withComments) {
        document.body.classList.add("pdf-with-comments");
        await new Promise((r) => setTimeout(r, 150));
        pdf.addPage();
        await addTimelineSnapshotToPdf(pdf, {
          margin,
          pageW,
          pageH,
          titleSuffix: " · details & opmerkingen",
        });
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const suffix = withComments ? "met_opmerkingen" : "tijdlijn";
      pdf.save(`precon_tijdlijn_${suffix}_${dateStr}.pdf`);
    } catch (error) {
      console.error("PDF export mislukt:", error);
      window.alert(
        "Er ging iets mis bij het maken van de PDF. Probeer het opnieuw of gebruik de gewone afdrukfunctie.",
      );
    } finally {
      document.body.classList.remove("pdf-export-mode", "pdf-with-comments");
      onCollapseAll();
      setPdfBusy(null);
    }
  }

  return (
    <div className="header-right">
      <button type="button" className="btn-outline" onClick={onRefresh}>
        ↻ Ververs
      </button>
      <button
        type="button"
        className="btn-outline"
        onClick={() => downloadJson(board)}
      >
        ⬆ Exporteer data
      </button>
      <button type="button" className="btn-outline" onClick={onCollapseAll}>
        Alles inklappen
      </button>
      <button type="button" className="btn-outline" onClick={printTimelineOnly}>
        🖨 Afdrukken
      </button>
      <button
        type="button"
        className="btn-outline"
        onClick={() => void downloadPdf(true)}
        disabled={!!pdfBusy}
      >
        ⬇ PDF (met opmerkingen)
      </button>
      <button
        type="button"
        className="btn"
        onClick={() => void downloadPdf(false)}
        disabled={!!pdfBusy}
      >
        ⬇ PDF (tijdlijn)
      </button>

      {pdfBusy && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,56,85,.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 14,
            color: "#fff",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              border: "4px solid rgba(255,255,255,.25)",
              borderTopColor: "#F46000",
              borderRadius: "50%",
              animation: "vp-pdfspin 0.9s linear infinite",
            }}
          />
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: ".5px" }}>
            {pdfBusy}
          </div>
          <style>
            {"@keyframes vp-pdfspin { to { transform: rotate(360deg); } }"}
          </style>
        </div>
      )}
    </div>
  );
}
