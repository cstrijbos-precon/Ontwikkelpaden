-- Accounts die collega's zelf aanmaken bij de eerste keer inloggen.
-- Bestaande accounts uit de omgevingsvariabele APP_USERS blijven werken:
-- die lijst is in Vercel als 'sensitive' opgeslagen en niet meer uit te lezen,
-- dus overzetten kan niet. De code kijkt eerst hier, daarna in APP_USERS.

CREATE TABLE IF NOT EXISTS app_users (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  aangemaakt_op TIMESTAMPTZ NOT NULL DEFAULT now(),
  laatst_ingelogd_op TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_app_users_aangemaakt
  ON app_users (aangemaakt_op DESC);
