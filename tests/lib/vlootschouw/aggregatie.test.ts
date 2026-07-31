import { describe, expect, it } from "vitest";
import { groepeerPerPadEnWereld } from "@/lib/vlootschouw/aggregatie";
import type { RolRij } from "@/lib/vlootschouw/types";

describe("groepeerPerPadEnWereld", () => {
  it("telt aanwezig/nodig per (pad, wereld) op over alle niveaus", () => {
    const rollen: RolRij[] = [
      {
        padId: "vakexpert",
        niveau: 1,
        rolNaam: "Consultant",
        wereld: "QA",
        aanwezig: 2,
        nodigNu: 1,
        nodigStraks: 0,
      },
      {
        padId: "vakexpert",
        niveau: 2,
        rolNaam: "Deskundige",
        wereld: "QA",
        aanwezig: 1,
        nodigNu: 2,
        nodigStraks: 0,
      },
      {
        padId: "vakexpert",
        niveau: 1,
        rolNaam: "Consultant",
        wereld: "RA",
        aanwezig: 0,
        nodigNu: 0,
        nodigStraks: 0,
      },
    ];

    const resultaat = groepeerPerPadEnWereld(rollen);
    const qaVakexpert = resultaat.find(
      (r) => r.padId === "vakexpert" && r.wereld === "QA",
    );
    expect(qaVakexpert).toEqual({
      padId: "vakexpert",
      wereld: "QA",
      aanwezig: 3,
      nodigNu: 3,
      nodigStraks: 0,
      vervullingPercentage: 100,
    });
  });

  it("laat vervullingPercentage null als er niets nodig is", () => {
    const rollen: RolRij[] = [
      {
        padId: "leider",
        niveau: 1,
        rolNaam: "Consultant",
        wereld: "NF",
        aanwezig: 2,
        nodigNu: 0,
        nodigStraks: 0,
      },
    ];
    const resultaat = groepeerPerPadEnWereld(rollen);
    expect(resultaat[0]?.vervullingPercentage).toBeNull();
  });
});
