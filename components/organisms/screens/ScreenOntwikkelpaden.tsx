import { FormField } from "@/components/molecules/FormField";
import { ScoreBox } from "@/components/molecules/ScoreBox";
import { FrameworkOverzicht } from "@/components/organisms/FrameworkOverzicht";
import { NiveauCorrectieBlok } from "@/components/organisms/NiveauCorrectieBlok";
import { PadenGrid } from "@/components/organisms/PadenGrid";
import { SenioriteitBlok } from "@/components/organisms/SenioriteitBlok";
import { TProfielGrid } from "@/components/organisms/TProfielGrid";
import type { OntwikkelpadenState, PadId } from "@/types/ontwikkelpaden";

interface ScreenOntwikkelpadenProps {
  state: OntwikkelpadenState;
  onUpdate: <K extends keyof OntwikkelpadenState>(
    key: K,
    value: OntwikkelpadenState[K],
  ) => void;
  onSetVorigJaar: (padId: PadId, n: number) => void;
  onSetNiveauCorrectie: (padId: PadId, niveau: number | null) => void;
  onToggleTCell: (r: number, k: number) => void;
}

export function ScreenOntwikkelpaden({
  state,
  onUpdate,
  onSetVorigJaar,
  onSetNiveauCorrectie,
  onToggleTCell,
}: ScreenOntwikkelpadenProps) {
  return (
    <>
      <div className="scherm-titel">Ontwikkelpaden</div>
      <div className="scherm-sub">
        Jouw positie op de vier paden, berekend op basis van je
        competentiescores
      </div>
      <ScoreBox state={state} />
      <div className="tip-box">
        Sleep een oranje bolletje omhoog of omlaag om de inschaling handmatig
        aan te passen. Het bolletje landt altijd op een heel niveau. Licht een
        aanpassing toe in het vak dat eronder verschijnt.
      </div>
      <div style={{ overflowX: "auto", marginBottom: 20 }}>
        <PadenGrid
          state={state}
          onSetVorigJaar={onSetVorigJaar}
          onSetNiveauCorrectie={onSetNiveauCorrectie}
        />
      </div>
      <NiveauCorrectieBlok
        state={state}
        onHerstel={(padId) => onSetNiveauCorrectie(padId, null)}
        onToelichting={(waarde) =>
          onUpdate("niveauCorrectieToelichting", waarde)
        }
      />
      <FrameworkOverzicht state={state} />
      <div className="sk">T-profiel</div>
      <div className="tip-box">
        Klik de vakjes om je T-profiel in te vullen. De T bestaat uit één
        horizontale rij bovenaan en twee verticale kolommen naar beneden. Klik
        nogmaals om te wissen.
      </div>
      <TProfielGrid state={state} onToggle={onToggleTCell} />
      <div
        style={{
          fontSize: 11,
          color: "var(--grijs-licht)",
          marginTop: 4,
        }}
      >
        Oranje = T-profiel ingevuld
      </div>
      <div className="form-rij" style={{ marginTop: 12 }}>
        <FormField label="Diepte: expertise in">
          <textarea
            rows={2}
            placeholder="Waarin ben je expert?"
            value={state.tDiepte}
            onChange={(e) => onUpdate("tDiepte", e.target.value)}
          />
        </FormField>
        <FormField label="Breedte: kennis van">
          <textarea
            rows={2}
            placeholder="Welke aangrenzende gebieden ken je?"
            value={state.tBreedte}
            onChange={(e) => onUpdate("tBreedte", e.target.value)}
          />
        </FormField>
      </div>
      <SenioriteitBlok
        state={state}
        onUpdate={(waarde) => onUpdate("niveauInschaling", waarde)}
      />
    </>
  );
}
