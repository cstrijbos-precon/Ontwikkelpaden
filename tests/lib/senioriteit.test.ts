import { describe, expect, it } from "vitest";
import { createInitialState } from "@/lib/initial-state";
import { bepaalSenioriteit, leesTProfiel } from "@/lib/senioriteit";
import type { PadId } from "@/types/ontwikkelpaden";

const geenTProfiel = { diep: false, breed: false };

function niveaus(
  vakexpert: number,
  adviseur: number,
  leider: number,
  trainer: number,
): Record<PadId, number> {
  return { vakexpert, adviseur, leider, trainer };
}

describe("bepaalSenioriteit", () => {
  it("noemt iemand zonder behaalde niveaus junior", () => {
    const advies = bepaalSenioriteit(niveaus(0, 0, 0, 0), geenTProfiel);
    expect(advies.suggestie).toBe("junior");
    expect(advies.volgendeStap).toContain("Voor medior");
  });

  it("noemt twee paden op niveau 2 medior", () => {
    expect(bepaalSenioriteit(niveaus(2, 2, 0, 0), geenTProfiel).suggestie).toBe(
      "medior",
    );
  });

  it("vraagt bij het niveau-3-criterium om alle vier de paden", () => {
    // Drie paden op niveau 1 gevuld, vierde nog leeg: nog geen medior.
    expect(bepaalSenioriteit(niveaus(3, 1, 1, 0), geenTProfiel).suggestie).toBe(
      "junior",
    );
    expect(bepaalSenioriteit(niveaus(3, 1, 1, 1), geenTProfiel).suggestie).toBe(
      "medior",
    );
  });

  it("noemt twee paden op niveau 3 senior", () => {
    const advies = bepaalSenioriteit(niveaus(3, 3, 0, 0), geenTProfiel);
    expect(advies.suggestie).toBe("senior");
    expect(advies.volgendeStap).toBeNull();
  });

  it("maakt van één hoog pad zonder tweede pad op niveau 3 nog geen senior", () => {
    // 4 / 2 / 2 / 2 — wel een pad op niveau 4, maar geen tweede pad op 3.
    expect(bepaalSenioriteit(niveaus(4, 2, 2, 2), geenTProfiel).suggestie).toBe(
      "medior",
    );
  });

  it("valt bij een niveau-4-profiel terug op het criterium van twee paden op 3", () => {
    // Het tweede seniorcriterium uit de gids (1 pad op 4, 1 ander op 3) houdt
    // per definitie al twee paden op niveau 3 in, dus criterium 1 vangt dit af.
    const advies = bepaalSenioriteit(niveaus(4, 3, 2, 2), geenTProfiel);
    expect(advies.suggestie).toBe("senior");
    expect(advies.reden).toContain("2 ontwikkelpaden niveau 3");
  });

  it("laat een T-profiel de suggestie niet veranderen", () => {
    const zonder = bepaalSenioriteit(niveaus(1, 0, 0, 0), geenTProfiel);
    const met = bepaalSenioriteit(niveaus(1, 0, 0, 0), {
      diep: true,
      breed: true,
    });
    expect(zonder.suggestie).toBe("junior");
    expect(met.suggestie).toBe("junior");
    expect(met.tProfiel).toEqual({ diep: true, breed: true });
  });

  it("telt de volgorde van de paden niet mee", () => {
    const a = bepaalSenioriteit(niveaus(0, 3, 0, 3), geenTProfiel);
    const b = bepaalSenioriteit(niveaus(3, 3, 0, 0), geenTProfiel);
    expect(a.suggestie).toBe(b.suggestie);
  });
});

describe("leesTProfiel", () => {
  it("leest diepte en breedte uit de ingevulde tekstvelden", () => {
    const state = createInitialState();
    expect(leesTProfiel(state)).toEqual({ diep: false, breed: false });

    state.tDiepte = "  Aanbestedingsrecht ";
    state.tBreedte = "   ";
    expect(leesTProfiel(state)).toEqual({ diep: true, breed: false });
  });
});
