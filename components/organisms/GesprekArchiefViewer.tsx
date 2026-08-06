"use client";

import { useState } from "react";
import { ScreenAfronding } from "@/components/organisms/screens/ScreenAfronding";
import { ScreenAmbitie } from "@/components/organisms/screens/ScreenAmbitie";
import { ScreenCompetenties } from "@/components/organisms/screens/ScreenCompetenties";
import { ScreenGegevens } from "@/components/organisms/screens/ScreenGegevens";
import { ScreenHoeGaatHet } from "@/components/organisms/screens/ScreenHoeGaatHet";
import { ScreenOntwikkelpaden } from "@/components/organisms/screens/ScreenOntwikkelpaden";
import { ScreenPop } from "@/components/organisms/screens/ScreenPop";
import { ScreenPraktijksituaties } from "@/components/organisms/screens/ScreenPraktijksituaties";
import { ScreenProfiel } from "@/components/organisms/screens/ScreenProfiel";
import { TabNavigation } from "@/components/organisms/TabNavigation";
import { SCHERMEN } from "@/lib/data/schermen";
import type { Gesprek } from "@/types/gesprekken";

const NOOP = () => {};

interface GesprekArchiefViewerProps {
  gesprek: Gesprek;
}

/** Read-only weergave van een gearchiveerd/afgerond gesprek — hergebruikt de bestaande schermen. */
export function GesprekArchiefViewer({ gesprek }: GesprekArchiefViewerProps) {
  const [huidig, setHuidig] = useState(0);
  const { state } = gesprek;
  const screenId = SCHERMEN[huidig]?.id;
  const leegSet = new Set<string>();

  return (
    <>
      <div className="scherm" style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 12, color: "var(--grijs-licht)" }}>
          Archief — {gesprek.medewerkerNaam || "onbekend"} ·{" "}
          {gesprek.gesprekDatum || "geen datum"} · status: {gesprek.status}
        </p>
      </div>
      <TabNavigation
        huidig={huidig}
        status={gesprek.status}
        onSelect={setHuidig}
      />
      <div className="scherm">
        <fieldset disabled style={{ border: "none", padding: 0, margin: 0 }}>
          {screenId === "s1" && (
            <ScreenGegevens
              state={state}
              importWarnings={[]}
              medewerkerEmail={gesprek.medewerkerEmail}
              knownEmails={[]}
              onUpdate={NOOP}
              onImportDocx={NOOP}
              onDismissImportWarnings={NOOP}
              onSetMedewerkerEmail={NOOP}
            />
          )}
          {screenId === "s2" && (
            <ScreenHoeGaatHet state={state} onUpdate={NOOP} />
          )}
          {screenId === "s3" && (
            <ScreenPraktijksituaties
              state={state}
              onUpdate={NOOP}
              onUpdateSituatie={NOOP}
            />
          )}
          {screenId === "s4" && <ScreenProfiel state={state} onUpdate={NOOP} />}
          {screenId === "s5" && (
            <ScreenCompetenties
              state={state}
              openComps={leegSet}
              openSterren={leegSet}
              onToggleComp={NOOP}
              onToggleSter={NOOP}
              onSetSter={NOOP}
              onUpdateOpmerking={NOOP}
            />
          )}
          {screenId === "s6" && (
            <ScreenOntwikkelpaden
              state={state}
              onUpdate={NOOP}
              onSetVorigJaar={NOOP}
              onSetNiveauCorrectie={NOOP}
              onToggleTCell={NOOP}
            />
          )}
          {screenId === "s7" && (
            <ScreenAmbitie
              state={state}
              onUpdate={NOOP}
              onToggleAmbitie={NOOP}
              onSetTrainingsgroep={NOOP}
            />
          )}
          {screenId === "s8" && (
            <ScreenAfronding
              state={state}
              status={gesprek.status}
              medewerkerEmail={gesprek.medewerkerEmail}
              onUpdate={NOOP}
              onAfronden={NOOP}
            />
          )}
        </fieldset>
        {screenId === "s9" && (
          <fieldset disabled style={{ border: "none", padding: 0, margin: 0 }}>
            <ScreenPop
              state={state}
              status={gesprek.status}
              previousGesprekId={gesprek.previousGesprekId}
              openPopPads={leegSet}
              openToolboxes={leegSet}
              onUpdate={NOOP}
              onTogglePopPad={NOOP}
              onToggleToolbox={NOOP}
              onAddReflectie={NOOP}
              onUpdateReflectie={NOOP}
              onRemoveReflectie={NOOP}
              onStartNewCycle={NOOP}
            />
          </fieldset>
        )}
      </div>
    </>
  );
}
