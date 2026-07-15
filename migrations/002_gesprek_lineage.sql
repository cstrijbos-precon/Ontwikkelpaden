-- Run in Neon SQL Editor (https://console.neon.tech), na 001_gesprekken.sql
-- Voegt lineage toe tussen jaarlijkse gesprekken (cyclisch functioneringsgesprek + POP).

ALTER TABLE gesprekken
  ADD COLUMN IF NOT EXISTS previous_gesprek_id UUID REFERENCES gesprekken(id);

CREATE INDEX IF NOT EXISTS idx_gesprekken_previous_gesprek_id
  ON gesprekken (previous_gesprek_id);
