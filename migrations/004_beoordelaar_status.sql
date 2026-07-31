-- Run in Neon SQL Editor (https://console.neon.tech), na 001-003.
-- Voegt goedkeuringsstatus toe voor hoofd-/medebeoordelaar-koppelingen: als een
-- beoordelaar zichzelf toevoegt (via de dashboard-dropdown) staat de koppeling
-- op 'in_afwachting' totdat de medewerker deze goedkeurt.

ALTER TABLE gesprekken
  ADD COLUMN IF NOT EXISTS hoofdbeoordelaar_status TEXT NOT NULL DEFAULT 'toegestaan'
    CHECK (hoofdbeoordelaar_status IN ('in_afwachting', 'toegestaan')),
  ADD COLUMN IF NOT EXISTS medebeoordelaar_status TEXT NOT NULL DEFAULT 'toegestaan'
    CHECK (medebeoordelaar_status IN ('in_afwachting', 'toegestaan'));
