# Trainingslijnen — setup guide

Interne Precon-app voor trainingslijnen. Gebruikt **tijdelijke auth** via gehashte wachtwoorden in environment variables. Later migreren naar Microsoft Entra ID (zie onderaan).

---

## Vereisten

- Node.js 20.9+ (vereist voor Next.js 16)
- Vercel-account (voor deployment)

---

## Lokaal opstarten

### 1. Dependencies installeren

```bash
npm install
```

### 2. Environment variables

Kopieer `.env.example` naar `.env.local`:

```bash
cp .env.example .env.local
```

Genereer `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Genereer een bcrypt-hash voor je wachtwoord:

```bash
npm run hash-password -- jouw-sterk-wachtwoord
```

Plak het resultaat in `.env.local`. **Let op:** bcrypt-hashes bevatten `$` tekens. Next.js expandeert die in `.env.local` — escape elke `$` met een backslash (`\$`). Het script `npm run hash-password` print de juiste regel automatisch.

```env
AUTH_SECRET=<openssl-output>
APP_USERS=klammers@precon.nl:\$2b\$12\$...
APP_ADMINS=klammers@precon.nl
```

Op **Vercel** hoef je niet te escapen — plak de hash daar gewoon in het Environment Variables veld.

Meerdere gebruikers (komma-gescheiden):

```env
APP_USERS=kim@precon.nl:$2b$12$...,jan@precon.nl:$2b$12$...
```

### 3. Neon database (optioneel lokaal)

De app gebruikt **Neon Postgres** via de Vercel-integratie. `@neondatabase/serverless` is al geïnstalleerd; de client staat in `lib/db.ts`.

**Environment variables ophalen:**

```bash
vercel link
vercel env pull .env.development.local
```

Next.js laadt `.env.local` en `.env.development.local` samen. Zorg dat `DATABASE_URL` in één van die bestanden staat (gebruik de **pooled** URL met `-pooler` in de hostname).

**Tabellen aanmaken** — open de [Neon SQL Editor](https://console.neon.tech) en voer het script uit:

```
migrations/001_gesprekken.sql
```

Dit maakt `gesprekken` (hoofdtabel + JSONB state), `gesprek_competenties` en `gesprek_paden` (rapportage-extract) aan.

**Verbinding testen** — na `npm run dev`, ingelogd als gebruiker:

```
GET /api/health
```

Verwacht: `"database": { "configured": true, "connected": true }`.

**API (gesprekken):**

| Methode | Pad | Beschrijving |
|---------|-----|--------------|
| `GET` | `/api/gesprekken` | Lijst gesprekken (eigen + admin ziet alles) |
| `POST` | `/api/gesprekken` | Nieuw concept-gesprek aanmaken |
| `GET` | `/api/gesprekken/:id` | Volledig gesprek laden |
| `PUT` | `/api/gesprekken/:id` | State opslaan (autosave) |

### 4. Development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — je wordt doorgestuurd naar `/login`.

---

## Beveiliging (tijdelijke auth)

| Maatregel | Status |
|-----------|--------|
| Wachtwoorden gehashed (bcrypt, cost 12) | Ja |
| JWT-sessies via Auth.js | Ja |
| Sessie verloopt na 8 uur | Ja |
| Proxy op pagina's (`proxy.ts`, Next.js 16) | Ja |
| `auth()` op API-routes | Ja |
| Security headers | Ja (`next.config.ts`) |
| Secrets alleen server-side | Ja |

### Aanbevolen op Vercel

1. Zet `AUTH_SECRET`, `APP_USERS`, `APP_ADMINS` in **Environment Variables**
2. Overweeg **Deployment Protection** (Settings → Deployment Protection)
3. Gebruik sterke wachtwoorden

---

## Vercel deployment

1. Maak Vercel-project `trainingslijnen`
2. Koppel Git-repo
3. Voeg env vars toe (Production + Preview + Development)
4. Deploy

---

## Naamgeving (voor latere Entra-migratie)

| Item | Waarde |
|------|--------|
| App slug | `trainingslijnen` |
| Entra-app (later) | `Precon Trainingslijnen` |
| Gebruikersgroep (later) | `precon-trainingslijnen-users` |
| Admingroep (later) | `precon-trainingslijnen-admins` |

---

## Migratie naar Entra ID (later)

1. Maak Entra-groepen en app-registratie (zie XLIFF Translate `docs/SETUP.md`)
2. Vervang Credentials-provider door `MicrosoftEntraID` in `auth.ts`
3. Verwijder `APP_USERS` uit env vars
4. Loginpagina: knop "Inloggen met Microsoft" i.p.v. formulier
5. `APP_ADMINS` vervangen door Entra-groep `precon-trainingslijnen-admins`

---

## Projectstructuur

```
app/                  # Routes
components/
  atoms/              # Button, Input
  molecules/          # LoginForm
  organisms/          # LoginCard, HomePage, DashboardHeader
lib/                  # auth-users, is-admin
types/                # next-auth type extensions
```
