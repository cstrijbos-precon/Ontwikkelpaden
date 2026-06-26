# Trainingslijnen — Claude Code instructies

Je werkt aan de **Précon Persoonlijke Ontwikkelpaden** app (interne tool voor functioneringsgesprekken).

## Eerste stap voor elke gebruiker

Lees en volg **`README.md`** — daar staat stap voor stap hoe iemand zonder programmeerkennis de app in GitHub Codespaces draait.

## Projectregels

De volgende regels worden via `@`-import automatisch in **elke** Claude Code-sessie,
-chat en -subagent geladen (de `alwaysApply`-frontmatter werkt alleen in Cursor,
daarom importeren we ze hier expliciet):

@.claude/rules/precon-architecture.mdc
@.claude/rules/precon-stack.mdc
@.claude/rules/precon-security.mdc
@.claude/rules/precon-api-routes.mdc
@.claude/rules/precon-typescript.mdc
@.claude/rules/precon-testing.mdc
@.claude/rules/precon-linting.mdc
@.claude/rules/precon-licenses.mdc

## Belangrijke paden

```
app/                    # Pagina's en API-routes
components/             # UI (atoms → molecules → organisms)
hooks/useOntwikkelpaden.ts   # Formulierstate + opslaan naar database
services/gesprekken-client.ts # Fetch naar /api/gesprekken
lib/gesprekken.ts       # Database-queries (server)
tests/                  # Tests (mirror layout: tests/lib/, tests/hooks/, tests/app/api/)
migrations/001_gesprekken.sql  # Database-tabellen (eenmalig in Neon uitvoeren)
docs/SETUP.md           # Verwijzing naar README
README.md               # Gebruikershandleiding (hoofddocument)
```

## Dataopslag

Formuliergegevens worden opgeslagen in **Neon Postgres** (tabel `gesprekken`), niet meer in localStorage. Autosave elke 5 minuten + bij navigatie en handmatig opslaan.

## Wat je niet moet doen

- Geen secrets committen (`.env.local` staat in `.gitignore`)
- Geen GPL/AGPL dependencies toevoegen (zie `precon-licenses.mdc`)
- Geen businesslogica in JSX — gebruik `hooks/`, `lib/`, `services/`

## Hulp voor niet-technische gebruikers

Als iemand vastloopt: vraag welke stap in **`README.md`** ze doen, en geef **één concrete actie** per antwoord (bijv. “open het bestand `.env.local` in de linker bestandsboom”).
