# Setup-handleiding

De volledige opstartinstructies staan in de **[README.md](../README.md)** in de root van dit project.

Die handleiding is bedoeld voor gebruikers **zonder programmeerervaring** die de app draaien in **GitHub Codespaces**.

## Snel antwoord: database al door beheerder?

Als de beheerder `migrations/001_gesprekken.sql` al in Neon heeft uitgevoerd, **hoef jij geen SQL meer te draaien**. Jij moet alleen:

1. `.env.local` aanmaken (kopie van `.env.example`)
2. `DATABASE_URL` van de beheerder plakken
3. `AUTH_SECRET` en `APP_USERS` instellen
4. `npm run dev` en inloggen

Zie **[README.md → Database: wat is al geregeld?](../README.md#database-wat-is-al-geregeld)**.
