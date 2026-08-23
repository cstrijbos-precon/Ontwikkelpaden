import { useSession } from "next-auth/react";
import { useState } from "react";
import { DateInput } from "@/components/atoms/DateInput";
import { FormField } from "@/components/molecules/FormField";
import { ScoreBox } from "@/components/molecules/ScoreBox";
import { PAD_IDS, PADEN } from "@/lib/data/paden";
import { effectiefNiveau } from "@/lib/effectief-niveau";
import { getPadColor } from "@/lib/pad-colors";
import type { GesprekStatus } from "@/types/gesprekken";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface ScreenAfrondingProps {
  state: OntwikkelpadenState;
  status: GesprekStatus;
  medewerkerEmail: string | null;
  onUpdate: <K extends keyof OntwikkelpadenState>(
    key: K,
    value: OntwikkelpadenState[K],
  ) => void;
  onAfronden: () => void;
}

function formatTijdstip(iso: string): string {
  if (!iso) return "";
  const datum = new Date(iso);
  if (Number.isNaN(datum.getTime())) return "";
  return datum.toLocaleString("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

interface SignBoxProps {
  roleLabel: string;
  persoonEmail: string;
  signed: boolean;
  signedNaam: string;
  signedAt: string;
  canSign: boolean;
  onSign: (naam: string) => void;
  onWijzig: () => void;
}

function SignBox({
  roleLabel,
  persoonEmail,
  signed,
  signedNaam,
  signedAt,
  canSign,
  onSign,
  onWijzig,
}: SignBoxProps) {
  const [draftNaam, setDraftNaam] = useState("");

  return (
    <div className="sign-box">
      <p style={{ margin: 0, fontWeight: "bold" }}>
        {roleLabel}: {persoonEmail || "___________"}
      </p>
      {signed ? (
        <>
          <p style={{ margin: "4px 0 0", color: "var(--groen)" }}>
            ✓ Ondertekend door {signedNaam}
            {signedAt ? ` op ${formatTijdstip(signedAt)}` : ""}
          </p>
          {canSign && (
            <button
              type="button"
              className="btn btn-t"
              style={{ marginTop: 6, fontSize: 11 }}
              onClick={onWijzig}
            >
              Wijzig
            </button>
          )}
        </>
      ) : canSign ? (
        <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
          <input
            value={draftNaam}
            placeholder="Typ je volledige naam ter bevestiging"
            onChange={(e) => setDraftNaam(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-v"
            disabled={!draftNaam.trim()}
            onClick={() => onSign(draftNaam.trim())}
          >
            Bevestig
          </button>
        </div>
      ) : (
        <p style={{ margin: "4px 0 0", color: "var(--grijs-licht)" }}>
          Wacht op ondertekening door {persoonEmail || "de beoordelaar"}.
        </p>
      )}
    </div>
  );
}

export function ScreenAfronding({
  state,
  status,
  medewerkerEmail,
  onUpdate,
  onAfronden,
}: ScreenAfrondingProps) {
  const { data: session } = useSession();
  const sessionEmail = session?.user?.email?.toLowerCase() ?? null;
  const isAdmin = session?.user?.isAdmin ?? false;

  const alleAkkoord =
    state.akkoordProfessional &&
    state.akkoordHoofdbeoordelaar &&
    state.akkoordMedebeoordelaar;

  const magTekenenAls = (roleEmail: string | null) =>
    isAdmin ||
    (sessionEmail !== null &&
      roleEmail !== null &&
      roleEmail.trim().toLowerCase() === sessionEmail);

  return (
    <>
      <div className="scherm-titel">Afronding & ondertekening</div>
      <FormField label="Overige afspraken">
        <textarea
          rows={4}
          value={state.overigeAfspraken}
          onChange={(e) => onUpdate("overigeAfspraken", e.target.value)}
        />
      </FormField>
      <FormField label="Datum volgend functioneringsgesprek">
        <DateInput
          value={state.datumVolgend}
          onValueChange={(value) => onUpdate("datumVolgend", value)}
        />
      </FormField>
      <div className="sk">Samenvatting</div>
      <ScoreBox state={state} />
      <div className="score-box score-box-ambitie">
        <h4>Positie op de ontwikkelpaden</h4>
        {PAD_IDS.map((padId) => {
          const pad = PADEN[padId];
          const n = effectiefNiveau(padId, state);
          const amb = state.ambities[padId];
          const tg = state.trainingsgroepen[padId];

          return (
            <div key={padId} className="score-rij">
              <span style={{ color: getPadColor(padId), fontWeight: "bold" }}>
                {pad.label}
              </span>
              <span style={{ textAlign: "right" }}>
                {n > 0
                  ? `Niveau ${n} – ${pad.rollen[n - 1]}`
                  : "Niet ingeschaald"}
                {amb && n < 5
                  ? ` → Ambitie: niveau ${n + 1} – ${pad.rollen[n]}`
                  : ""}
                {tg && (
                  <>
                    <br />
                    <span
                      style={{ fontSize: "10.5px", color: "var(--oranje)" }}
                    >
                      Trainingsgroep: {tg}
                    </span>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <div className="afsluiting-box">
        <p
          style={{
            fontSize: 13,
            fontWeight: "bold",
            color: "var(--grijs)",
            marginBottom: 12,
          }}
        >
          Ondertekening voor akkoord
        </p>
        <div className="sign-grid">
          <SignBox
            roleLabel="Professional"
            persoonEmail={medewerkerEmail ?? state.naam}
            signed={state.akkoordProfessional}
            signedNaam={state.akkoordProfessionalNaam}
            signedAt={state.akkoordProfessionalAt}
            canSign={magTekenenAls(medewerkerEmail)}
            onSign={(naam) => {
              onUpdate("akkoordProfessional", true);
              onUpdate("akkoordProfessionalNaam", naam);
              onUpdate("akkoordProfessionalAt", new Date().toISOString());
            }}
            onWijzig={() => {
              onUpdate("akkoordProfessional", false);
              onUpdate("akkoordProfessionalNaam", "");
              onUpdate("akkoordProfessionalAt", "");
            }}
          />
          <SignBox
            roleLabel="Hoofdbeoordelaar"
            persoonEmail={state.hoofdbeoordelaar}
            signed={state.akkoordHoofdbeoordelaar}
            signedNaam={state.akkoordHoofdbeoordelaarNaam}
            signedAt={state.akkoordHoofdbeoordelaarAt}
            canSign={magTekenenAls(state.hoofdbeoordelaar)}
            onSign={(naam) => {
              onUpdate("akkoordHoofdbeoordelaar", true);
              onUpdate("akkoordHoofdbeoordelaarNaam", naam);
              onUpdate("akkoordHoofdbeoordelaarAt", new Date().toISOString());
            }}
            onWijzig={() => {
              onUpdate("akkoordHoofdbeoordelaar", false);
              onUpdate("akkoordHoofdbeoordelaarNaam", "");
              onUpdate("akkoordHoofdbeoordelaarAt", "");
            }}
          />
          <SignBox
            roleLabel="Medebeoordelaar"
            persoonEmail={state.medebeoordelaar}
            signed={state.akkoordMedebeoordelaar}
            signedNaam={state.akkoordMedebeoordelaarNaam}
            signedAt={state.akkoordMedebeoordelaarAt}
            canSign={magTekenenAls(state.medebeoordelaar)}
            onSign={(naam) => {
              onUpdate("akkoordMedebeoordelaar", true);
              onUpdate("akkoordMedebeoordelaarNaam", naam);
              onUpdate("akkoordMedebeoordelaarAt", new Date().toISOString());
            }}
            onWijzig={() => {
              onUpdate("akkoordMedebeoordelaar", false);
              onUpdate("akkoordMedebeoordelaarNaam", "");
              onUpdate("akkoordMedebeoordelaarAt", "");
            }}
          />
        </div>
        <button
          type="button"
          className="btn btn-v"
          style={{ marginTop: 16 }}
          disabled={!alleAkkoord || status === "completed"}
          onClick={onAfronden}
        >
          {status === "completed"
            ? "✓ Gesprek is afgerond"
            : "Gesprek afronden"}
        </button>
        {status === "completed" && (
          <p style={{ fontSize: 11, color: "var(--groen)", marginTop: 8 }}>
            Dit functioneringsgesprek is afgerond en vergrendeld. Verder werken
            kan nu op het POP-scherm.
          </p>
        )}
        <p
          style={{
            fontSize: 11,
            color: "var(--grijs-licht)",
            marginTop: 14,
            fontStyle: "italic",
          }}
        >
          Na ondertekening per mail doorsturen naar hr@precongroup.com
        </p>
      </div>
    </>
  );
}
