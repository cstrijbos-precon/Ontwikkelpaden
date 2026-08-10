-- Een e-mailadres is pas bewijs van identiteit als iemand ook echt bij die
-- mailbox kan. Zonder deze stap kon wie een adres kende zich daarmee als
-- eerste registreren en bij het gesprek van die collega komen.

-- Bestaande accounts zijn door een beheerder aangemaakt en gelden als
-- geverifieerd; nieuwe beginnen op NULL tot de link in de mail is gevolgd.
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS geverifieerd_op TIMESTAMPTZ;

UPDATE app_users SET geverifieerd_op = aangemaakt_op
  WHERE geverifieerd_op IS NULL;

-- We bewaren alleen een hash van het token, zodat een lek van deze tabel geen
-- werkende links oplevert.
CREATE TABLE IF NOT EXISTS email_verificaties (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  verloopt_op TIMESTAMPTZ NOT NULL,
  gebruikt_op TIMESTAMPTZ,
  aangemaakt_op TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verificaties_email
  ON email_verificaties (email);
