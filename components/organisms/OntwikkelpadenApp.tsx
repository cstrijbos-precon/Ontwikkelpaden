"use client";

import { ScreenNav } from "@/components/molecules/ScreenNav";
import { AppHeader } from "@/components/organisms/AppHeader";
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
import { useOntwikkelpaden } from "@/hooks/useOntwikkelpaden";
import { SCHERMEN } from "@/lib/data/schermen";

interface OntwikkelpadenAppProps {
  gesprekId?: string;
}

export function OntwikkelpadenApp({ gesprekId }: OntwikkelpadenAppProps = {}) {
  const app = useOntwikkelpaden(gesprekId);

  if (!app.hydrated) {
    return (
      <div className="scherm" style={{ textAlign: "center", padding: 48 }}>
        Laden...
      </div>
    );
  }

  if (app.loadError) {
    return (
      <div className="scherm" style={{ textAlign: "center", padding: 48 }}>
        <p>Kon gegevens niet laden uit de database.</p>
        <p style={{ color: "#666", marginTop: 8 }}>{app.loadError}</p>
        <p style={{ color: "#666", marginTop: 16, fontSize: "0.9rem" }}>
          Controleer of de database is ingesteld (zie README.md).
        </p>
      </div>
    );
  }

  const scherm = SCHERMEN[app.huidig];
  const screenId = scherm?.id;
  const gesprekVergrendeld =
    scherm?.fase === "gesprek" && app.status !== "draft";

  return (
    <>
      <AppHeader
        saveStatus={app.saveStatus}
        onSave={app.handleSave}
        onExport={app.handleExport}
      />
      <TabNavigation
        huidig={app.huidig}
        status={app.status}
        onSelect={app.naarScherm}
      />
      <div className="scherm">
        <fieldset
          disabled={gesprekVergrendeld}
          style={{ border: "none", padding: 0, margin: 0 }}
        >
          {screenId === "s1" && (
            <ScreenGegevens
              state={app.state}
              importWarnings={app.importWarnings}
              medewerkerEmail={app.medewerkerEmail}
              knownEmails={app.knownEmails}
              onUpdate={app.updateField}
              onImportDocx={app.handleImportDocx}
              onDismissImportWarnings={app.dismissImportWarnings}
              onSetMedewerkerEmail={app.setMedewerkerEmail}
            />
          )}
          {screenId === "s2" && (
            <ScreenHoeGaatHet state={app.state} onUpdate={app.updateField} />
          )}
          {screenId === "s3" && (
            <ScreenPraktijksituaties
              state={app.state}
              onUpdate={app.updateField}
              onUpdateSituatie={app.updateSituatie}
            />
          )}
          {screenId === "s4" && (
            <ScreenProfiel state={app.state} onUpdate={app.updateField} />
          )}
          {screenId === "s5" && (
            <ScreenCompetenties
              state={app.state}
              openComps={app.openComps}
              openSterren={app.openSterren}
              onToggleComp={app.toggleComp}
              onToggleSter={app.toggleSter}
              onSetSter={app.setSter}
              onUpdateOpmerking={app.updateOpmerking}
            />
          )}
          {screenId === "s6" && (
            <ScreenOntwikkelpaden
              state={app.state}
              onUpdate={app.updateField}
              onSetVorigJaar={app.setVorigJaar}
              onSetNiveauCorrectie={app.setNiveauCorrectie}
              onToggleTCell={app.toggleTCell}
            />
          )}
          {screenId === "s7" && (
            <ScreenAmbitie
              state={app.state}
              onUpdate={app.updateField}
              onToggleAmbitie={app.toggleAmbitie}
              onSetTrainingsgroep={app.setTrainingsgroep}
            />
          )}
          {screenId === "s8" && (
            <ScreenAfronding
              state={app.state}
              status={app.status}
              medewerkerEmail={app.medewerkerEmail}
              onUpdate={app.updateField}
              onAfronden={app.handleAfronden}
            />
          )}
        </fieldset>
        {screenId === "s9" && (
          <ScreenPop
            state={app.state}
            status={app.status}
            previousGesprekId={app.previousGesprekId}
            openPopPads={app.openPopPads}
            openToolboxes={app.openToolboxes}
            onUpdate={app.updateField}
            onTogglePopPad={app.togglePopPad}
            onToggleToolbox={app.toggleToolbox}
            onAddReflectie={app.addReflectie}
            onUpdateReflectie={app.updateReflectie}
            onRemoveReflectie={app.removeReflectie}
            onStartNewCycle={app.handleStartNewCycle}
          />
        )}
        <ScreenNav
          huidig={app.huidig}
          onTerug={app.terug}
          onVolgende={app.volgende}
        />
      </div>
    </>
  );
}
