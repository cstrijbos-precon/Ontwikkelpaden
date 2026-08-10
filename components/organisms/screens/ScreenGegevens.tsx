import { useSession } from "next-auth/react";
import { useState } from "react";
import { DateInput } from "@/components/atoms/DateInput";
import { FormField } from "@/components/molecules/FormField";
import { WERELDEN } from "@/lib/data/werelden";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

interface ScreenGegevensProps {
  state: OntwikkelpadenState;
  importWarnings: string[];
  medewerkerEmail: string | null;
  knownEmails: string[];
  onUpdate: <K extends keyof OntwikkelpadenState>(
    key: K,
    value: OntwikkelpadenState[K],
  ) => void;
  onImportDocx: (file: File) => void;
  onDismissImportWarnings: () => void;
  onSetMedewerkerEmail: (email: string | null) => void;
}

function BeoordelaarEmailField({
  label,
  value,
  knownEmails,
  onChange,
}: {
  label: string;
  value: string;
  knownEmails: string[];
  onChange: (value: string) => void;
}) {
  const normalized = value.trim().toLowerCase();
  const bekend = normalized !== "" && knownEmails.includes(normalized);
  return (
    <FormField label={label}>
      <input
        type="email"
        list="bekende-accounts"
        value={value}
        placeholder="naam@precongroup.com"
        onChange={(e) => onChange(e.target.value)}
      />
      {normalized !== "" && !bekend && (
        <p style={{ fontSize: 11, color: "var(--oranje)", marginTop: 4 }}>
          ⚠ Geen account gevonden met dit e-mailadres — deze persoon krijgt pas
          toegang tot dit dossier zodra er een account voor bestaat.
        </p>
      )}
    </FormField>
  );
}

export function ScreenGegevens({
  state,
  importWarnings,
  medewerkerEmail,
  knownEmails,
  onUpdate,
  onImportDocx,
  onDismissImportWarnings,
  onSetMedewerkerEmail,
}: ScreenGegevensProps) {
  const { data: session } = useSession();
  const sessionEmail = session?.user?.email?.toLowerCase() ?? null;
  const [nietEigenGesprek, setNietEigenGesprek] = useState(false);
  const vraagTonen =
    !medewerkerEmail && !nietEigenGesprek && sessionEmail !== null;

  return (
    <>
      <div className="scherm-titel">Basisgegevens</div>
      <div className="scherm-sub">
        F-04 Functioneringsgesprek en POP · versie 02/04/2026
      </div>
      <datalist id="bekende-accounts">
        {knownEmails.map((email) => (
          <option key={email} value={email} />
        ))}
      </datalist>
      {vraagTonen && (
        <div
          style={{
            background: "#fff8e6",
            border: "1px solid #e8c766",
            borderRadius: 5,
            padding: "10px 14px",
            margin: "0 0 16px",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span>Is dit jouw eigen functioneringsgesprek?</span>
          <span style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn btn-v"
              onClick={() => sessionEmail && onSetMedewerkerEmail(sessionEmail)}
            >
              Ja
            </button>
            <button
              type="button"
              className="btn btn-t"
              onClick={() => setNietEigenGesprek(true)}
            >
              Nee
            </button>
          </span>
        </div>
      )}
      {sessionEmail && medewerkerEmail === sessionEmail && (
        <p
          style={{
            fontSize: 11,
            color: "var(--grijs-licht)",
            margin: "0 0 16px",
          }}
        >
          Dit is jouw eigen functioneringsgesprek — je kunt op scherm Afronding
          voor akkoord tekenen als professional.
        </p>
      )}
      <div className="form-rij" style={{ alignItems: "center" }}>
        <label className="btn btn-t" style={{ display: "inline-block" }}>
          📄 Importeer oud gesprek (.docx)
          <input
            type="file"
            accept=".docx"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportDocx(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {importWarnings.length > 0 && (
        <div
          style={{
            background: "#fff8e6",
            border: "1px solid #e8c766",
            borderRadius: 5,
            padding: "10px 14px",
            margin: "12px 0",
            fontSize: 13,
          }}
        >
          <strong>Let op bij import:</strong>
          <ul style={{ margin: "6px 0 8px", paddingLeft: 20 }}>
            {importWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-t"
            onClick={onDismissImportWarnings}
          >
            Begrepen
          </button>
        </div>
      )}
      <div className="form-rij">
        <FormField label="Naam professional">
          <input
            value={state.naam}
            placeholder="Volledige naam..."
            onChange={(e) => onUpdate("naam", e.target.value)}
          />
        </FormField>
        <FormField label="Bij Précon sinds">
          <input
            value={state.bijPreconSinds}
            placeholder="bijv. januari 2022"
            onChange={(e) => onUpdate("bijPreconSinds", e.target.value)}
          />
        </FormField>
      </div>
      <div className="form-rij">
        <FormField label="Wereld">
          <select
            value={state.wereld}
            onChange={(e) => onUpdate("wereld", e.target.value)}
          >
            <option value="">Kies een wereld...</option>
            {WERELDEN.map((wereld) => (
              <option key={wereld} value={wereld}>
                {wereld}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="form-rij">
        <FormField label="Datum gesprek">
          <DateInput
            value={state.datum}
            onValueChange={(value) => onUpdate("datum", value)}
          />
        </FormField>
        <FormField label="Datum vorig gesprek">
          <DateInput
            value={state.datumVorig}
            onValueChange={(value) => onUpdate("datumVorig", value)}
          />
        </FormField>
      </div>
      <div className="form-rij">
        <BeoordelaarEmailField
          label="Hoofdbeoordelaar (e-mailadres)"
          value={state.hoofdbeoordelaar}
          knownEmails={knownEmails}
          onChange={(value) => onUpdate("hoofdbeoordelaar", value)}
        />
        <BeoordelaarEmailField
          label="Medebeoordelaar (e-mailadres)"
          value={state.medebeoordelaar}
          knownEmails={knownEmails}
          onChange={(value) => onUpdate("medebeoordelaar", value)}
        />
      </div>
    </>
  );
}
