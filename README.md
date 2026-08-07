# Ontwikkelpaden — Précon Persoonlijke Ontwikkelpaden

Interne webapp voor functioneringsgesprekken en POP. Ingevulde gegevens worden opgeslagen in een **gedeelde Neon-database** (niet in je browser).

---

## Database: wat is al geregeld?

De database-tabellen (`gesprekken`, `gesprek_competenties`, `gesprek_paden`) worden **één keer** aangemaakt in Neon — door een beheerder. Dat hoef je **niet** per persoon opnieuw te doen.

| Wie | Wat |
|-----|-----|
| **Beheerder (bijv. Kim)** — al gedaan | SQL-scripts uit `migrations/` in Neon uitgevoerd (ook `006_app_users.sql` voor de logins) |
| **Jij (nieuwe gebruiker)** | Alleen je eigen `.env.local` invullen + app starten (stappen hieronder) |

**De database werkt voor jou zodra:**

1. De tabellen al in Neon bestaan (beheerder heeft dit gedaan) ✓  
2. Jij `DATABASE_URL` in **jouw** `.env.local` hebt staan (zelfde URL als de beheerder je geeft)  
3. Jij `AUTH_SECRET` hebt ingesteld (en zelf een account aanmaakt bij de eerste keer inloggen)  
4. Je `npm run dev` draait en inlogt  

Je hoeft **geen** Neon-account en **geen** SQL uit te voeren als de beheerder de tabellen al heeft aangemaakt.

---

## Wat je nodig hebt

| Item | Wie regelt dit? |
|------|-----------------|
| Toegang tot de GitHub-repository | Jij (uitgenodigd door Precon) |
| GitHub Codespaces | Gratis bij je GitHub-account |
| `DATABASE_URL` | Beheerder stuurt je de URL (uit Vercel/Neon) |
| Inloggegevens | Je maakt zelf een account aan op het inlogscherm |

---

## Stap 1 — Codespace openen

1. Ga in je browser naar de **GitHub-repository** van Ontwikkelpaden.
2. Klik op de groene knop **Code**.
3. Kies het tabblad **Codespaces**.
4. Klik op **Create codespace on main** (of op de naam van de standaardbranch).
5. Wacht tot het scherm geladen is. Links zie je een **bestandslijst**, onderin een **terminal**. Dit kan 2–5 minuten duren (eerste keer).

Je hoeft niets op je eigen computer te installeren.

---

## Stap 2 — Claude openen (optioneel)

1. Open het **Claude**-paneel in Codespaces.
2. Claude kent dit project via **`CLAUDE.md`**.
3. Vraag bijvoorbeeld: *“Help me stap 4 van de README”*.

---

## Stap 3 — Dependencies installeren

De Codespace voert vaak automatisch `npm install` uit. Zo niet, typ in de terminal:

```bash
npm install
```

Geen rode foutmeldingen = goed.

---

## Stap 4 — `.env.local` aanmaken en invullen

Geheime instellingen staan in **`.env.local`** — dat bestand staat **niet** op GitHub. Iedere gebruiker maakt zijn **eigen** exemplaar.

### 4a. Bestand kopiëren

1. Zoek **`.env.example`** in de linker bestandslijst.
2. Rechtsklik → **Copy** → **Paste**.
3. Hernoem de kopie naar **`.env.local`**.

### 4b. Vul deze vier dingen in

Open **`.env.local`** en pas aan:

#### `AUTH_SECRET`

In de terminal:

```bash
openssl rand -base64 32
```

Kopieer de output en plak achter `AUTH_SECRET=`:

```env
AUTH_SECRET=jouw-gekopieerde-waarde-hier
```

#### `DATABASE_URL`

**Vraag de beheerder om de `DATABASE_URL`.** Die is hetzelfde voor iedereen (gedeelde database). Plak de volledige regel in `.env.local`:

```env
DATABASE_URL=postgresql://...@ep-...-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

De URL moet **`-pooler`** in de hostname bevatten. Zonder deze regel kan de app niet opslaan.

#### `APP_ADMINS`

```env
APP_ADMINS=jouw@email.nl
```

Beheerders zien alle gesprekken. Wie hier niet in staat, ziet alleen de eigen
gesprekken en die waarvan hij beoordelaar is.

**Sla `.env.local` op** (Ctrl+S / Cmd+S).

#### Een account: dat maak je zelf aan

Je hoeft geen `APP_USERS` meer in te vullen. Vul op het inlogscherm je werkadres
in; is dat nog niet bekend, dan vraagt de app meteen om een wachtwoord te
bedenken. Het account komt in de tabel `app_users` in de database te staan.

Alleen adressen van `precongroup.com` en `tal-leadership.nl` kunnen een account
maken. Een andere lijst instellen kan met `APP_EMAIL_DOMEINEN`:

```env
APP_EMAIL_DOMEINEN=precongroup.com,tal-leadership.nl
```

Wil je dat mensen ook een gedeelde code nodig hebben om zich aan te melden, zet
dan `APP_REGISTRATIECODE`. Laat je die leeg, dan is het adres de enige drempel.

```env
APP_REGISTRATIECODE=een-code-die-intern-rondgaat
```

> **Let op:** er wordt geen verificatiemail gestuurd. Iedereen met een adres in
> een toegestaan domein kan zich registreren — ook op een adres dat niet van
> hem is, zolang de eigenaar dat zelf nog niet heeft gedaan. De registratiecode
> is de manier om dat af te schermen.

#### Bestaande accounts uit `APP_USERS`

Wie al inlogde vóór deze wijziging, houdt zijn account: de app kijkt eerst in de
database en daarna in `APP_USERS` (en `APP_USERS_EXTRA`). Die lijsten zijn in
Vercel als *sensitive* opgeslagen en dus niet meer uit te lezen, waardoor
overzetten naar de database niet kan. Ze blijven daarom gewoon werken.

Een los account toevoegen zonder de bestaande lijst te kennen, kan via
`APP_USERS_EXTRA` — zelfde opmaak, wordt bij `APP_USERS` opgeteld:

```bash
npm run hash-password -- JouwSterkWachtwoord123
```

---

## Stap 5 — App starten

```bash
npm run dev
```

1. Wacht op `Ready` of `Local: http://localhost:3000`.
2. Open het tabblad **Ports** (onderin, naast Terminal).
3. Klik op poort **3000** (of **3001** als 3000 bezet is) → **Open in Browser**.

Je komt op de **loginpagina**.

---

## Stap 6 — Inloggen

1. Vul je werkadres in en klik **Verder**.
2. Ken de app je nog niet, dan bedenk je meteen een wachtwoord. Anders vul je je bestaande wachtwoord in.
3. Inloggen → je ziet het formulier met 9 schermen.

---

## Stap 7 — Controleren of alles werkt

### Database

Ingelogd, open in de browser (zelfde host als de app):

`/api/health`

Verwacht:

```json
"database": { "configured": true, "connected": true }
```

### Opslaan

1. Vul iets in op scherm 1 (bijv. een naam).
2. Klik **Opslaan** of wacht ~5 minuten.
3. **✓ Opgeslagen om …** rechtsboven.
4. Vernieuw de pagina (F5) — gegevens komen terug uit de database.

---

## Veelvoorkomende problemen

| Probleem | Oplossing |
|----------|-----------|
| “Kon gegevens niet laden uit de database” | `DATABASE_URL` ontbreekt of klopt niet. Vraag de URL aan de beheerder. Herstart: Ctrl+C, dan `npm run dev`. |
| Database `connected: false` | Verkeerde `DATABASE_URL`, of tabellen ontbreken (beheerder moet de scripts uit `migrations/` in Neon draaien). |
| “Unauthorized” bij /api/… | Niet ingelogd — ga eerst naar de loginpagina. |
| Poort 3000 = andere app | Gebruik poort **3001** in Ports. |
| PDF-import levert lege velden op | De PDF bevat waarschijnlijk geen tekstlaag (een scan of foto). Gebruik dan het Word-bestand. |
| Inloggen lukt niet | Nog geen account? Vul je adres in en kies een wachtwoord. Bij een oud account uit `APP_USERS`: elke `$` in de hash moet `\$` zijn in `.env.local`. |
| "Alleen adressen van ..." | Je domein staat niet in `APP_EMAIL_DOMEINEN`. |
| Wachtwoord vergeten | Een beheerder opent op het dashboard **Accounts en wachtwoorden** en klikt op *Wachtwoord vrijgeven*. Je kiest dan bij de volgende keer inloggen een nieuw wachtwoord; je gesprekken blijven staan. |
| `.env.local` wijziging werkt niet | Server stoppen (Ctrl+C) en opnieuw `npm run dev`. |

---

## Alleen voor beheerders

### Database-tabellen (eenmalig, per Neon-project)

Als dit **nog niet** is gedaan:

1. [Neon Console](https://console.neon.tech) → SQL Editor.
2. Voer de bestanden uit `migrations/` op volgorde uit (001 t/m 006).
3. `006_app_users.sql` is nodig voor het inloggen; zonder die tabel kan niemand een account aanmaken.

Daarna hoeven andere gebruikers **alleen** de `DATABASE_URL` in hun `.env.local` te zetten.

### Vercel

1. Project **ontwikkelpaden** koppelen aan deze repo.
2. Neon-integratie → `DATABASE_URL` in Vercel Environment Variables.
3. Ook `AUTH_SECRET` en `APP_ADMINS` zetten, en eventueel `APP_EMAIL_DOMEINEN` en `APP_REGISTRATIECODE`.
4. Deel `DATABASE_URL` veilig met gebruikers voor Codespaces.

**Tip:** bij `vercel env pull` nooit een bestaande `.env.local` overschrijven zonder backup — anders verdwijnen `APP_USERS` en `AUTH_SECRET`.

---

## AI-assistenten

| Tool | Configuratie |
|------|----------------|
| **Cursor** | `.cursor/rules/` |
| **Claude Code** | `CLAUDE.md` + `.claude/rules/` |

---

## Stack

Next.js 16 · Auth.js (tijdelijk wachtwoord-login, accounts in Neon) · Neon Postgres · Vercel

---

## Hulp

Vraag Claude: *“Ik ben bij stap X in de README en zie [foutmelding]. Wat moet ik doen?”*

Of neem contact op met de beheerder die je repository-toegang en `DATABASE_URL` heeft gegeven.
