import { describe, expect, it } from "vitest";
import { berekenAlleNiveaus, berekenNiveau } from "@/lib/bereken-niveau";
import { createInitialState } from "@/lib/initial-state";

describe("berekenNiveau", () => {
  it("returns 0 when scores are too low", () => {
    expect(berekenNiveau("vakexpert", { b: 0, k: 0, o: 0, org: 0, t: 0 })).toBe(
      0,
    );
  });

  it("returns highest satisfied level", () => {
    expect(berekenNiveau("vakexpert", { b: 3, k: 4, o: 3, org: 3, t: 0 })).toBe(
      5,
    );
  });

  it("stops at first unmet level", () => {
    expect(berekenNiveau("vakexpert", { b: 2, k: 2, o: 2, org: 1, t: 0 })).toBe(
      3,
    );
  });
});

describe("berekenAlleNiveaus", () => {
  it("computes niveau for all paden", () => {
    const state = createInitialState();
    state.scores = { b: 1, k: 1, o: 1, org: 1, t: 0 };
    const niveaus = berekenAlleNiveaus(state);
    expect(niveaus.vakexpert).toBe(1);
    expect(niveaus.adviseur).toBeGreaterThanOrEqual(0);
    expect(Object.keys(niveaus)).toEqual([
      "vakexpert",
      "adviseur",
      "leider",
      "trainer",
    ]);
  });
});
