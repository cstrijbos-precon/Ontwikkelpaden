-- Teller per sleutel (bv. "login:ip:1.2.3.4") voor lib/rate-limit.ts.
-- Vercel draait serverless: elke request kan op een andere instance landen,
-- dus een teller in het geheugen houdt niets bij. De database is de gedeelde
-- plek die alle instances zien. Eén rij per sleutel; het venster begint bij
-- de eerste poging en de teller start opnieuw zodra het is verlopen.
CREATE TABLE IF NOT EXISTS rate_limits (
  sleutel TEXT PRIMARY KEY,
  venster_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  aantal INTEGER NOT NULL DEFAULT 0
);
