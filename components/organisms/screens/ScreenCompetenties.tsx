import { CompetencyList } from "@/components/organisms/CompetencyList";
import type { CompId, OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface ScreenCompetentiesProps {
  state: OntwikkelpadenState;
  openComps: Set<string>;
  openSterren: Set<string>;
  onToggleComp: (id: string) => void;
  onToggleSter: (id: string) => void;
  onSetSter: (compId: CompId, n: number) => void;
  onUpdateOpmerking: (compId: CompId, value: string) => void;
}

export function ScreenCompetenties({
  state,
  openComps,
  openSterren,
  onToggleComp,
  onToggleSter,
  onSetSter,
  onUpdateOpmerking,
}: ScreenCompetentiesProps) {
  return (
    <>
      <div className="scherm-titel">Competenties invullen</div>
      <div className="scherm-sub">
        Bespreek per competentie welk niveau bij jou past · gebruik de
        Ontwikkelpadengids als ondersteuning
      </div>
      <div className="info-box">
        Lees de beschrijving per ster. Klik de ster aan waarvoor je bij{" "}
        <strong>alle</strong> gedragspunten in het kader een goed
        praktijkvoorbeeld kunt geven.
      </div>
      <CompetencyList
        scores={state.scores}
        opmerkingen={state.opmerkingen}
        openComps={openComps}
        openSterren={openSterren}
        onToggleComp={onToggleComp}
        onToggleSter={onToggleSter}
        onSetSter={onSetSter}
        onUpdateOpmerking={onUpdateOpmerking}
      />
    </>
  );
}
