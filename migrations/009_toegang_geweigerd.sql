-- Wie een gesprek aanmaakt (created_by) hield tot nu toe voor altijd toegang,
-- ook nadat de medewerker die persoon expliciet als beoordelaar had
-- afgewezen. Deze kolom houdt bij wie is afgewezen en wanneer, zodat
-- canAccessGesprek die toegang alsnog kan intrekken. Het gesprek zelf en het
-- werk dat erin staat blijven gewoon bestaan — alleen de toegang van de
-- afgewezen persoon vervalt.
ALTER TABLE gesprekken
  ADD COLUMN IF NOT EXISTS toegang_geweigerd JSONB NOT NULL DEFAULT '[]'::jsonb;
