import { hasDatabase, sql } from "@/lib/db";

/**
 * Begrenst hoe vaak iets binnen een tijdvenster mag gebeuren (inlogpogingen,
 * mails versturen, uploads). De tellers staan in de database en niet in het
 * geheugen: Vercel draait serverless, dus opeenvolgende requests landen op
 * verschillende instances die niets van elkaar weten.
 *
 * Valt de database weg, dan laten we het verkeer gewoon door. Een storing in
 * de teller mag niet betekenen dat niemand meer kan inloggen — en zonder
 * database werkt de rest van de app toch al niet.
 */

export const LIMIETEN = {
  /** Mislukte inlogpogingen op één account. */
  loginPerAccount: { max: 5, vensterSeconden: 15 * 60 },
  /** Mislukte inlogpogingen vanaf één IP-adres. Ruim: een kantoor deelt vaak één adres. */
  loginPerIp: { max: 30, vensterSeconden: 15 * 60 },
  /** "Is dit adres bekend?" per IP-adres. Ruim, om dezelfde reden. */
  accountStatusPerIp: { max: 60, vensterSeconden: 10 * 60 },
  /** Aanmeldpogingen per IP-adres: remt het raden van de registratiecode. */
  registratiePerIp: { max: 10, vensterSeconden: 60 * 60 },
  /** Verificatiemails naar één adres, zodat niemand een collega kan volspammen. */
  registratiePerEmail: { max: 3, vensterSeconden: 60 * 60 },
  /** Uploads van Word/PDF per ingelogde gebruiker. */
  importPerGebruiker: { max: 10, vensterSeconden: 10 * 60 },
} as const;

export interface Limiet {
  max: number;
  vensterSeconden: number;
}

export interface LimietUitkomst {
  toegestaan: boolean;
  /** Seconden tot het venster verloopt; 0 als er niets geblokkeerd is. */
  opnieuwOverSeconden: number;
}

const TOEGESTAAN: LimietUitkomst = { toegestaan: true, opnieuwOverSeconden: 0 };

/** Een op de honderd keer ruimen we verlopen rijen op, zodat de tabel niet groeit. */
const OPRUIMKANS = 0.01;

interface TellerRij {
  aantal: number;
  rest: number;
}

/** Telt één gebeurtenis bij en geeft de nieuwe stand terug. */
async function verhoog(
  sleutel: string,
  vensterSeconden: number,
): Promise<TellerRij | null> {
  if (!hasDatabase()) return null;
  try {
    const rows = (await sql`
      INSERT INTO rate_limits (sleutel, venster_start, aantal)
      VALUES (${sleutel}, now(), 1)
      ON CONFLICT (sleutel) DO UPDATE SET
        aantal = CASE
          WHEN rate_limits.venster_start < now() - make_interval(secs => ${vensterSeconden}::double precision)
          THEN 1 ELSE rate_limits.aantal + 1 END,
        venster_start = CASE
          WHEN rate_limits.venster_start < now() - make_interval(secs => ${vensterSeconden}::double precision)
          THEN now() ELSE rate_limits.venster_start END
      RETURNING
        aantal,
        GREATEST(0, CEIL(EXTRACT(EPOCH FROM (
          venster_start + make_interval(secs => ${vensterSeconden}::double precision) - now()
        ))))::int AS rest
    `) as TellerRij[];

    if (Math.random() < OPRUIMKANS) {
      await sql`DELETE FROM rate_limits WHERE venster_start < now() - interval '1 day'`;
    }
    return rows[0] ?? null;
  } catch (error) {
    console.error("rate-limit: bijtellen mislukt", error);
    return null;
  }
}

/** Leest de stand zonder iets bij te tellen. 0 als het venster verlopen is. */
async function lees(
  sleutel: string,
  vensterSeconden: number,
): Promise<TellerRij | null> {
  if (!hasDatabase()) return null;
  try {
    const rows = (await sql`
      SELECT
        aantal,
        GREATEST(0, CEIL(EXTRACT(EPOCH FROM (
          venster_start + make_interval(secs => ${vensterSeconden}::double precision) - now()
        ))))::int AS rest
      FROM rate_limits
      WHERE sleutel = ${sleutel}
        AND venster_start >= now() - make_interval(secs => ${vensterSeconden}::double precision)
    `) as TellerRij[];
    return rows[0] ?? { aantal: 0, rest: 0 };
  } catch (error) {
    console.error("rate-limit: lezen mislukt", error);
    return null;
  }
}

/**
 * Telt deze aanroep mee en zegt of die er nog bij mag. Voor endpoints waar
 * elke aanroep telt, ongeacht de afloop.
 */
export async function beperk(
  sleutel: string,
  limiet: Limiet,
): Promise<LimietUitkomst> {
  const stand = await verhoog(sleutel, limiet.vensterSeconden);
  if (!stand) return TOEGESTAAN;
  return stand.aantal > limiet.max
    ? { toegestaan: false, opnieuwOverSeconden: stand.rest }
    : TOEGESTAAN;
}

/** Kijkt of de limiet al bereikt is, zonder mee te tellen. */
export async function isGeblokkeerd(
  sleutel: string,
  limiet: Limiet,
): Promise<LimietUitkomst> {
  const stand = await lees(sleutel, limiet.vensterSeconden);
  if (!stand) return TOEGESTAAN;
  return stand.aantal >= limiet.max
    ? { toegestaan: false, opnieuwOverSeconden: stand.rest }
    : TOEGESTAAN;
}

/** Telt één mislukte poging bij. */
export async function registreerMislukking(
  sleutel: string,
  limiet: Limiet,
): Promise<void> {
  await verhoog(sleutel, limiet.vensterSeconden);
}

/** Zet de teller terug, bv. na een geslaagde login. */
export async function wisTeller(sleutel: string): Promise<void> {
  if (!hasDatabase()) return;
  try {
    await sql`DELETE FROM rate_limits WHERE sleutel = ${sleutel}`;
  } catch (error) {
    console.error("rate-limit: wissen mislukt", error);
  }
}

/**
 * Het IP-adres van de aanvrager. Vercel zet x-forwarded-for zelf en
 * overschrijft wat een client meestuurt, dus de eerste waarde is te vertrouwen.
 */
export function clientIp(headers: Headers): string {
  const doorgestuurd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return doorgestuurd || headers.get("x-real-ip")?.trim() || "onbekend";
}

/** Antwoord voor een geblokkeerde aanvraag, met een Retry-After-header. */
export function teVeelAanvragen(
  uitkomst: LimietUitkomst,
  bericht = "Te veel pogingen. Probeer het later opnieuw.",
): Response {
  return Response.json(
    { error: bericht },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, uitkomst.opnieuwOverSeconden)),
      },
    },
  );
}
