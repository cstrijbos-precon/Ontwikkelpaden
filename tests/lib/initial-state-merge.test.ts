import { describe, expect, it } from "vitest";
import { createInitialState, mergeWithInitialState } from "@/lib/initial-state";

describe("mergeWithInitialState met onvolledige geneste gegevens", () => {
  it("vult ontbrekende competentie-scores aan in plaats van te falen", () => {
    // Zo komt een import binnen als de parser maar twee van de vijf scores
    // kon lezen.
    const resultaat = mergeWithInitialState({ scores: { b: 3, k: 2 } });

    expect(resultaat.scores).toEqual({ b: 3, k: 2, o: 0, org: 0, t: 0 });
  });

  it("vult ook andere geneste lijsten aan (opmerkingen, vorig jaar, ambities)", () => {
    const resultaat = mergeWithInitialState({
      opmerkingen: { b: "sterk" },
      vorigJaar: { leider: 2 },
      ambities: { trainer: true },
    });

    expect(resultaat.opmerkingen.b).toBe("sterk");
    expect(resultaat.opmerkingen.t).toBe("");
    expect(resultaat.vorigJaar).toEqual({
      ...createInitialState().vorigJaar,
      leider: 2,
    });
    expect(resultaat.ambities.trainer).toBe(true);
    expect(resultaat.ambities.vakexpert).toBe(false);
  });

  it("laat een volledig ingevulde lijst ongewijzigd", () => {
    const scores = { b: 1, k: 2, o: 3, org: 4, t: 0 };
    expect(mergeWithInitialState({ scores }).scores).toEqual(scores);
  });

  it("gooit nog steeds bij echt ongeldige waarden", () => {
    expect(() => mergeWithInitialState({ scores: { b: 9 } })).toThrow();
  });
});

describe("mergeImportIntoState", () => {
  it("houdt de bestaande scores vast die de import niet kon lezen", async () => {
    const { mergeImportIntoState } = await import("@/lib/initial-state");
    const huidig = {
      ...createInitialState(),
      scores: { b: 1, k: 1, o: 4, org: 3, t: 2 },
    };

    const resultaat = mergeImportIntoState(huidig, {
      scores: { b: 3 } as never,
    });

    // b komt uit de import; de rest blijft zoals de medewerker het had.
    expect(resultaat.scores).toEqual({ b: 3, k: 1, o: 4, org: 3, t: 2 });
  });

  it("neemt gewone velden uit de import over en laat de rest staan", async () => {
    const { mergeImportIntoState } = await import("@/lib/initial-state");
    const huidig = { ...createInitialState(), werkdruk: "oud", naam: "Jan" };

    const resultaat = mergeImportIntoState(huidig, { werkdruk: "nieuw" });

    expect(resultaat.werkdruk).toBe("nieuw");
    expect(resultaat.naam).toBe("Jan");
  });
});
