-- Run in Neon SQL Editor (https://console.neon.tech)
-- Replaces the earlier ontwikkelpaden prototype table.

DROP TABLE IF EXISTS ontwikkelpaden;

CREATE TABLE IF NOT EXISTS gesprekken (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medewerker_naam     TEXT NOT NULL DEFAULT '',
  medewerker_email    TEXT,
  bij_precon_sinds    TEXT NOT NULL DEFAULT '',
  gesprek_datum       DATE,
  datum_vorig         DATE,
  datum_volgend       DATE,
  hoofdbeoordelaar    TEXT NOT NULL DEFAULT '',
  medebeoordelaar     TEXT NOT NULL DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'completed', 'archived')),
  state               JSONB NOT NULL DEFAULT '{}',
  created_by          TEXT NOT NULL,
  updated_by          TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gesprekken_medewerker_naam
  ON gesprekken (medewerker_naam);
CREATE INDEX IF NOT EXISTS idx_gesprekken_medewerker_email
  ON gesprekken (medewerker_email) WHERE medewerker_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gesprekken_gesprek_datum
  ON gesprekken (gesprek_datum DESC);
CREATE INDEX IF NOT EXISTS idx_gesprekken_created_by
  ON gesprekken (created_by);
CREATE INDEX IF NOT EXISTS idx_gesprekken_status
  ON gesprekken (status);

CREATE TABLE IF NOT EXISTS gesprek_competenties (
  gesprek_id   UUID NOT NULL REFERENCES gesprekken(id) ON DELETE CASCADE,
  comp_id      TEXT NOT NULL CHECK (comp_id IN ('b', 'k', 'o', 'org', 't')),
  score        SMALLINT NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 4),
  opmerking    TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (gesprek_id, comp_id)
);

CREATE TABLE IF NOT EXISTS gesprek_paden (
  gesprek_id          UUID NOT NULL REFERENCES gesprekken(id) ON DELETE CASCADE,
  pad_id              TEXT NOT NULL CHECK (pad_id IN ('vakexpert', 'adviseur', 'leider', 'trainer')),
  vorig_jaar_niveau   SMALLINT NOT NULL DEFAULT 0 CHECK (vorig_jaar_niveau BETWEEN 0 AND 5),
  ambitie             BOOLEAN NOT NULL DEFAULT false,
  trainingsgroep_id   TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (gesprek_id, pad_id)
);
