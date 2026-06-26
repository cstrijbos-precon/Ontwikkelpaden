# Trainingslijnen — Précon Persoonlijke Ontwikkelpaden

Interne webapp voor functioneringsgesprekken en POP. Ingevulde gegevens worden opgeslagen in een **gedeelde Neon-database** (niet in je browser).

---

## Database: wat is al geregeld?

De database-tabellen (`gesprekken`, `gesprek_competenties`, `gesprek_paden`) worden **één keer** aangemaakt in Neon — door een beheerder. Dat hoef je **niet** per persoon opnieuw te doen.

| Wie | Wat |
|-----|-----|
| **Beheerder (bijv. Kim)** — al gedaan | SQL-script `migrations/001_gesprekken.sql` in Neon uitgevoerd |
| **Jij (nieuwe gebruiker)** | Alleen je eigen `.env.local` invullen + app starten (stappen hieronder) |

**De database werkt voor jou zodra:**

1. De tabellen al in Neon bestaan (beheerder heeft dit gedaan) ✓  
2. Jij `DATABASE_URL` in **jouw** `.env.local` hebt staan (zelfde URL als de beheerder je geeft)  
3. Jij `AUTH_SECRET` en `APP_USERS` hebt ingesteld (eigen login)  
4. Je `npm run dev` draait en inlogt  

Je hoeft **geen** Neon-account en **geen** SQL uit te voeren als de beheerder de tabellen al heeft aangemaakt.

---

## Wat je nodig hebt

| Item | Wie regelt dit? |
|------|-----------------|
| Toegang tot de GitHub-repository | Jij (uitgenodigd door Precon) |
| GitHub Codespaces | Gratis bij je GitHub-account |
| `DATABASE_URL` | Beheerder stuurt je de URL (uit Vercel/Neon) |
| Inloggegevens (`APP_USERS`) | Beheerder, of zelf aanmaken (stap 4) |

---

## Stap 1 — Codespace openen

1. Ga in je browser naar de **GitHub-repository** van Trainingslijnen.
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

#### `APP_USERS` en `APP_ADMINS`

**Optie A** — beheerder geeft je een kant-en-klare `APP_USERS`-regel.

**Optie B** — zelf een wachtwoord kiezen:

```bash
npm run hash-password -- JouwSterkWachtwoord123
```

Plak de geprinte regel in `.env.local`. In `.env.local`: escape elke `$` in de hash met `\$` (het script toont de juiste regel).

```env
APP_ADMINS=jouw@email.nl
```

**Sla `.env.local` op** (Ctrl+S / Cmd+S).

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

1. E-mailadres uit `APP_USERS`.
2. Het wachtwoord dat je bij `hash-password` gebruikte (niet de hash zelf).
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
| Database `connected: false` | Verkeerde `DATABASE_URL`, of tabellen ontbreken (beheerder moet `migrations/001_gesprekken.sql` in Neon draaien). |
| “Unauthorized” bij /api/… | Niet ingelogd — ga eerst naar de loginpagina. |
| Poort 3000 = andere app | Gebruik poort **3001** in Ports. |
| Inloggen lukt niet | `APP_USERS`: elke `$` in de hash moet `\$` zijn in `.env.local`. |
| `.env.local` wijziging werkt niet | Server stoppen (Ctrl+C) en opnieuw `npm run dev`. |

---

## Alleen voor beheerders

### Database-tabellen (eenmalig, per Neon-project)

Als dit **nog niet** is gedaan:

1. [Neon Console](https://console.neon.tech) → SQL Editor.
2. Kopieer alles uit `migrations/001_gesprekken.sql`.
3. Run. Tabellen: `gesprekken`, `gesprek_competenties`, `gesprek_paden`.

Daarna hoeven andere gebruikers **alleen** de `DATABASE_URL` in hun `.env.local` te zetten.

### Vercel

1. Project **trainingslijnen** koppelen aan deze repo.
2. Neon-integratie → `DATABASE_URL` in Vercel Environment Variables.
3. Ook `AUTH_SECRET`, `APP_USERS`, `APP_ADMINS` zetten.
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

Next.js 16 · Auth.js (tijdelijk wachtwoord-login) · Neon Postgres · Vercel

---

## Hulp

Vraag Claude: *“Ik ben bij stap X in de README en zie [foutmelding]. Wat moet ik doen?”*

Of neem contact op met de beheerder die je repository-toegang en `DATABASE_URL` heeft gegeven.
