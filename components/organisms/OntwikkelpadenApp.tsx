"use client";

import { SCHERMEN } from "@/lib/data/schermen";
import { useOntwikkelpaden } from "@/hooks/useOntwikkelpaden";
import { ScreenNav } from "@/components/molecules/ScreenNav";
import { AppHeader } from "@/components/organisms/AppHeader";
import { TabNavigation } from "@/components/organisms/TabNavigation";
import { ScreenAfsluiting } from "@/components/organisms/screens/ScreenAfsluiting";
import { ScreenAmbitie } from "@/components/organisms/screens/ScreenAmbitie";
import { ScreenCompetenties } from "@/components/organisms/screens/ScreenCompetenties";
import { ScreenGegevens } from "@/components/organisms/screens/ScreenGegevens";
import { ScreenHoeGaatHet } from "@/components/organisms/screens/ScreenHoeGaatHet";
import { ScreenOntwikkelpaden } from "@/components/organisms/screens/ScreenOntwikkelpaden";
import { ScreenPop } from "@/components/organisms/screens/ScreenPop";
import { ScreenPraktijksituaties } from "@/components/organisms/screens/ScreenPraktijksituaties";
import { ScreenProfiel } from "@/components/organisms/screens/ScreenProfiel";

export function OntwikkelpadenApp() {
  const app = useOntwikkelpaden();

  if (!app.hydrated) {
    return (
      <div className="scherm" style={{ textAlign: "center", padding: 48 }}>
        Laden...
      </div>
    );
  }

  const screenId = SCHERMEN[app.huidig]?.id;

  return (
    <>
      <AppHeader
        saveStatus={app.saveStatus}
        onSave={app.handleSave}
        onExport={app.handleExport}
      />
      <TabNavigation huidig={app.huidig} onSelect={app.naarScherm} />
      <div className="scherm">
        {screenId === "s1" && (
          <ScreenGegevens state={app.state} onUpdate={app.updateField} />
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
          <ScreenPop
            state={app.state}
            openPopPads={app.openPopPads}
            openToolboxes={app.openToolboxes}
            onUpdate={app.updateField}
            onTogglePopPad={app.togglePopPad}
            onToggleToolbox={app.toggleToolbox}
          />
        )}
        {screenId === "s9" && (
          <ScreenAfsluiting state={app.state} onUpdate={app.updateField} />
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
