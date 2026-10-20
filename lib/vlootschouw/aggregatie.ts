import type { Wereld } from "@/lib/data/werelden";
import type { RolRij } from "@/lib/vlootschouw/types";
import type { PadId } from "@/types/ontwikkelpaden";

/**
 * Puur/client-veilig: bevat GEEN import van lib/db of andere server-only
 * code, zodat dit bestand ook vanuit client components ("use client")
 * geïmporteerd kan worden zonder de databaseverbinding in de browserbundel
 * te trekken.
 */

export type WereldFilter = Wereld | "totaal";

export interface Aantallen {
  aanwezig: number;
  nodigNu: number;
  nodigStraks: number;
}

function somVan(rijen: RolRij[]): Aantallen {
  return {
    aanwezig: rijen.reduce((sum, r) => sum + r.aanwezig, 0),
    nodigNu: rijen.reduce((sum, r) => sum + r.nodigNu, 0),
    nodigStraks: rijen.reduce((sum, r) => sum + r.nodigStraks, 0),
  };
}

function inFilter(rij: RolRij, filter: WereldFilter): boolean {
  return filter === "totaal" || rij.wereld === filter;
}

/** Aantallen voor één positie op het pad (pad × niveau), over de gekozen wereld(en). */
export function somPerCel(
  rollen: RolRij[],
  padId: PadId,
  niveau: number,
  filter: WereldFilter,
): Aantallen {
  return somVan(
    rollen.filter(
      (r) => r.padId === padId && r.niveau === niveau && inFilter(r, filter),
    ),
  );
}

/** Aantallen voor een heel pad, over de gekozen wereld(en). */
export function somPerPad(
  rollen: RolRij[],
  padId: PadId,
  filter: WereldFilter,
): Aantallen {
  return somVan(rollen.filter((r) => r.padId === padId && inFilter(r, filter)));
}

/** Tot hoeveel procentpunt verschil we nog "op niveau" noemen. */
export const TOLERANTIE_PUNTEN = 5;

export interface Verdeling extends Aantallen {
  /** Aandeel van alle ingeschaalde mensen in dit pad dat nu op dit niveau zit (%). */
  aanwezigPct: number | null;
  /** Aandeel van de gewenste verdeling in dit pad dat op dit niveau hoort te zitten (%). */
  gewenstPct: number | null;
  /** aanwezigPct min gewenstPct, in procentpunten. Null zodra een van de twee ontbreekt. */
  verschilPunten: number | null;
}

function aandeel(deel: number, geheel: number): number | null {
  return geheel > 0 ? (deel / geheel) * 100 : null;
}

/**
 * Hoe is het pad verdeeld over de niveaus, nu en gewenst? Beide verdelingen
 * zijn een aandeel binnen het eigen pad, dus een pad waar maar een paar
 * mensen een gesprek hebben ingevuld is toch te vergelijken met de gewenste
 * verdeling. Een aantal delen door de hele populatie zegt daar niets over:
 * dat meet alleen hoeveel mensen al hebben ingevuld.
 */
export function verdelingPerCel(
  rollen: RolRij[],
  padId: PadId,
  niveau: number,
  filter: WereldFilter,
): Verdeling {
  const cel = somPerCel(rollen, padId, niveau, filter);
  const pad = somPerPad(rollen, padId, filter);

  const aanwezig = aandeel(cel.aanwezig, pad.aanwezig);
  const gewenst = aandeel(cel.nodigNu, pad.nodigNu);

  return {
    ...cel,
    aanwezigPct: aanwezig === null ? null : Math.round(aanwezig),
    gewenstPct: gewenst === null ? null : Math.round(gewenst),
    verschilPunten:
      aanwezig === null || gewenst === null
        ? null
        : Math.round(aanwezig - gewenst),
  };
}

export type VerdelingSoort = "geen-data" | "onder" | "op-niveau" | "boven";

/** Zit dit niveau onder, op of boven de gewenste verdeling? */
export function verdelingStatus(verschilPunten: number | null): VerdelingSoort {
  if (verschilPunten === null) return "geen-data";
  if (Math.abs(verschilPunten) <= TOLERANTIE_PUNTEN) return "op-niveau";
  return verschilPunten < 0 ? "onder" : "boven";
}

export interface Reactie {
  /** Mensen die in dit pad zijn ingeschaald. */
  ingeschaald: number;
  /** Mensen die in dit pad nodig zijn (de populatie). */
  nodig: number;
  /** Ingeschaald als percentage van nodig. Null als er niets nodig is. */
  pct: number | null;
}

/**
 * Hoeveel van de populatie is al ingeschaald? Dit is wat de oude
 * "vervulling" eigenlijk mat: een maat voor hoe betrouwbaar de verdeling is,
 * geen oordeel over de verdeling zelf.
 */
export function reactiePerPad(
  rollen: RolRij[],
  padId: PadId,
  filter: WereldFilter,
): Reactie {
  const pad = somPerPad(rollen, padId, filter);
  return {
    ingeschaald: pad.aanwezig,
    nodig: pad.nodigNu,
    pct:
      pad.nodigNu > 0 ? Math.round((pad.aanwezig / pad.nodigNu) * 100) : null,
  };
}
