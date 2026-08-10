import Link from "next/link";
import { FormField } from "@/components/molecules/FormField";
import { ReflectieItem } from "@/components/molecules/ReflectieItem";
import { COMPS } from "@/lib/data/competenties";
import { PAD_IDS, PADEN } from "@/lib/data/paden";
import { effectiefNiveau } from "@/lib/effectief-niveau";
import type { GesprekStatus } from "@/types/gesprekken";
import type {
  OntwikkelpadenState,
  Reflectie,
  Toolbox,
} from "@/types/ontwikkelpaden";

interface ToolboxPanelProps {
  doelN: number;
  rol: string;
  toolbox: Toolbox;
  open: boolean;
  onToggle: () => void;
}

function ToolboxPanel({
  doelN,
  rol,
  toolbox,
  open,
  onToggle,
}: ToolboxPanelProps) {
  const categories = [
    { key: "vereist" as const, label: "✅ Vereist" },
    { key: "zelfDoen" as const, label: "💪 Zelf doen" },
    { key: "systemen" as const, label: "💻 Systemen" },
    { key: "collega" as const, label: "👥 Leren van collega's" },
    { key: "trainingen" as const, label: "🎓 Trainingen" },
  ];

  return (
    <div className="toolbox-wrap">
      <button type="button" className="toolbox-hdr" onClick={onToggle}>
        📦 Toolbox voor niveau {doelN}: {rol} <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="toolbox-body open">
          {categories.map(
            ({ key, label }) =>
              toolbox[key]?.length > 0 && (
                <div key={key} className="tb-cat">
                  <h5>{label}</h5>
                  <ul className="tb-items">
                    {toolbox[key].map((item) => (
                      <li key={item} className="tb-item">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ),
          )}
        </div>
      )}
    </div>
  );
}

interface ScreenPopProps {
  state: OntwikkelpadenState;
  status: GesprekStatus;
  previousGesprekId: string | null;
  openPopPads: Set<string>;
  openToolboxes: Set<string>;
  onUpdate: <K extends keyof OntwikkelpadenState>(
    key: K,
    value: OntwikkelpadenState[K],
  ) => void;
  onTogglePopPad: (id: string) => void;
  onToggleToolbox: (id: string) => void;
  onAddReflectie: () => void;
  onUpdateReflectie: (
    id: string,
    patch: Partial<Pick<Reflectie, "datum" | "tekst">>,
  ) => void;
  onRemoveReflectie: (id: string) => void;
  onStartNewCycle: () => void;
}

export function ScreenPop({
  state,
  status,
  previousGesprekId,
  openPopPads,
  openToolboxes,
  onUpdate,
  onTogglePopPad,
  onToggleToolbox,
  onAddReflectie,
  onUpdateReflectie,
  onRemoveReflectie,
  onStartNewCycle,
}: ScreenPopProps) {
  const actief = PAD_IDS.filter(
    (padId) => state.ambities[padId] || effectiefNiveau(padId, state) > 0,
  );

  return (
    <>
      <div className="scherm-titel">Ontwikkeling & POP</div>
      <div className="scherm-sub">
        Je persoonlijk ontwikkelplan — stap 6, 7 en 8 samen vormen je POP
      </div>
      {actief.map((padId) => {
        const pad = PADEN[padId];
        const n = effectiefNiveau(padId, state);
        const heeftAmbitie = state.ambities[padId];
        const doelN = heeftAmbitie && n < 5 ? n + 1 : null;
        const vereist = doelN ? pad.vereisten[doelN - 1] : null;
        const toolbox = doelN ? pad.toolboxen[doelN] : null;
        const popId = `pb-${padId}`;
        const tbId = `tb-${padId}`;

        return (
          <div key={padId} className="pop-pad">
            <button
              type="button"
              className="pop-pad-header"
              onClick={() => onTogglePopPad(popId)}
            >
              <h4 className={pad.kleur}>
                {pad.label}
                {n > 0 ? ` – Niveau ${n}: ${pad.rollen[n - 1]}` : ""}
              </h4>
              <span style={{ fontSize: 11, color: "var(--grijs-licht)" }}>
                {heeftAmbitie && doelN
                  ? `Ambitie: niveau ${doelN} – ${pad.rollen[doelN - 1]}`
                  : "Geen ambitie"}{" "}
                ▼
              </span>
            </button>
            <div
              className={`pop-pad-body ${openPopPads.has(popId) ? "open" : ""}`}
            >
              {doelN && vereist ? (
                <>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      color: "var(--blauw)",
                      marginBottom: 8,
                    }}
                  >
                    Vereiste competenties voor niveau {doelN}:
                  </p>
                  {COMPS.filter(
                    (c) => !c.trainerOnly || padId === "trainer",
                  ).map((c) => {
                    const vSter = vereist[c.id] ?? 0;
                    const hSter = state.scores[c.id] ?? 0;
                    const ok = hSter >= vSter;
                    return (
                      <div
                        key={c.id}
                        className={`comp-status ${ok ? "ok" : "nog"}`}
                      >
                        <div className={`cdot ${ok ? "ok" : "nog"}`} />
                        {c.label}: {"★".repeat(vSter)} vereist{" "}
                        {ok
                          ? "✓ behaald"
                          : `(nog ${vSter - hSter} ster${vSter - hSter > 1 ? "ren" : ""} te gaan)`}
                      </div>
                    );
                  })}
                  {toolbox && (
                    <ToolboxPanel
                      doelN={doelN}
                      rol={pad.rollen[doelN - 1] ?? ""}
                      toolbox={toolbox}
                      open={openToolboxes.has(tbId)}
                      onToggle={() => onToggleToolbox(tbId)}
                    />
                  )}
                </>
              ) : (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--grijs-licht)",
                    padding: "4px 0",
                  }}
                >
                  {n >= 5
                    ? "✓ Hoogste niveau bereikt!"
                    : "Selecteer ambitie in scherm 7 om de toolbox te zien."}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div className="sk">Mijn plan</div>
      <FormField label="Wat ga ik concreet doen? (kies uit de toolboxen hierboven)">
        <textarea
          rows={5}
          placeholder="Kies de acties die bij jou passen..."
          value={state.toolboxKeuze}
          onChange={(e) => onUpdate("toolboxKeuze", e.target.value)}
        />
      </FormField>
      <FormField label="Checkpoints om bij te reflecteren">
        <textarea
          rows={3}
          placeholder="Momenten in het jaar waarop je stilstaat bij je groei..."
          value={state.checkpoints}
          onChange={(e) => onUpdate("checkpoints", e.target.value)}
        />
      </FormField>
      <FormField label="T-profiel ontwikkeling">
        <textarea
          rows={3}
          placeholder="Diepte: verder specialiseren in...&#10;Breedte: kennis uitbreiden over..."
          value={state.tProfielOntwikkeling}
          onChange={(e) => onUpdate("tProfielOntwikkeling", e.target.value)}
        />
      </FormField>
      <FormField label="Wat heb je geleerd uit je trainingslijn(en)?">
        <textarea
          rows={3}
          placeholder="Wat heb je opgestoken van de trainingen die je hebt gevolgd..."
          value={state.trainingslijnLeren}
          onChange={(e) => onUpdate("trainingslijnLeren", e.target.value)}
        />
      </FormField>

      <div className="sk">Reflecties</div>
      <div className="tip-box">
        Voeg gedurende het jaar reflectiemomenten toe — met een datum en je
        eigen woorden. Zo bouw je je POP zelf verder uit.
      </div>
      {state.reflecties.map((reflectie) => (
        <ReflectieItem
          key={reflectie.id}
          reflectie={reflectie}
          onUpdate={(patch) => onUpdateReflectie(reflectie.id, patch)}
          onRemove={() => onRemoveReflectie(reflectie.id)}
        />
      ))}
      <button type="button" className="btn btn-t" onClick={onAddReflectie}>
        + Reflectie toevoegen
      </button>

      <div className="sk">Volgend jaar</div>
      {status === "completed" ? (
        <div className="info-box">
          <p>
            Dit functioneringsgesprek is afgerond. Start hieronder de nieuwe
            cyclus: je sterren, T-profiel-framework en stamgegevens gaan mee, de
            rest begint leeg.
          </p>
          <button
            type="button"
            className="btn btn-v"
            style={{ marginTop: 10 }}
            onClick={onStartNewCycle}
          >
            Start nieuw functioneringsgesprek
          </button>
        </div>
      ) : (
        <div className="tip-box">
          Ronde eerst het functioneringsgesprek af (stap 8) om een nieuwe cyclus
          te kunnen starten.
        </div>
      )}
      {previousGesprekId && (
        <p style={{ marginTop: 12 }}>
          <Link href={`/gesprekken/${previousGesprekId}`}>
            Bekijk vorig gesprek
          </Link>
        </p>
      )}
    </>
  );
}
