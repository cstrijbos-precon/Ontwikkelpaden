-- Een hoofdbeoordelaar is voortaan een doorlopende relatie met een
-- medewerker, los van één enkel gesprek: eenmaal goedgekeurd ziet iemand al
-- het werk van die medewerker, ook oude jaren en gesprekken die nog moeten
-- komen. Zonder dit moest een hoofdbeoordelaar zich elk jaar opnieuw
-- koppelen, en kon iemand pas iets zien als er al een gesprek bestond.
--
-- Eén rij per medewerker: een nieuwe koppeling vervangt de vorige. Wie
-- vervangen wordt, verliest daarmee de toegang.
CREATE TABLE IF NOT EXISTS hoofdbeoordelaar_koppelingen (
  medewerker_email TEXT PRIMARY KEY,
  hoofdbeoordelaar_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_afwachting'
    CHECK (status IN ('in_afwachting', 'toegestaan')),
  aangemaakt_door TEXT NOT NULL,
  aangemaakt_op TIMESTAMPTZ NOT NULL DEFAULT now(),
  bijgewerkt_op TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hoofdbeoordelaar_koppelingen_hoofdbeoordelaar
  ON hoofdbeoordelaar_koppelingen (hoofdbeoordelaar_email);
