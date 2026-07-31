-- Run in Neon SQL Editor (https://console.neon.tech), na 001-004.
-- Voegt de "wereld" (afdeling) van de medewerker toe aan gesprekken, legt het
-- actueel berekende niveau per pad vast in gesprek_paden (voorheen alleen
-- client-side berekend), en introduceert de vlootschouw_planning-tabel voor
-- de handmatige norm-cijfers (nu/straks nodig per pad/niveau/wereld).

ALTER TABLE gesprekken
  ADD COLUMN IF NOT EXISTS wereld TEXT NOT NULL DEFAULT '';

ALTER TABLE gesprek_paden
  ADD COLUMN IF NOT EXISTS huidig_niveau SMALLINT NOT NULL DEFAULT 0
    CHECK (huidig_niveau BETWEEN 0 AND 5);

CREATE TABLE IF NOT EXISTS vlootschouw_planning (
  pad_id        TEXT NOT NULL CHECK (pad_id IN ('vakexpert', 'adviseur', 'leider', 'trainer')),
  niveau        SMALLINT NOT NULL CHECK (niveau BETWEEN 1 AND 5),
  wereld        TEXT NOT NULL CHECK (wereld IN ('QA', 'RA', 'NF', 'Learning', 'Overhead')),
  nodig_nu      SMALLINT NOT NULL DEFAULT 0 CHECK (nodig_nu >= 0),
  nodig_straks  SMALLINT NOT NULL DEFAULT 0 CHECK (nodig_straks >= 0),
  updated_by    TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (pad_id, niveau, wereld)
);
