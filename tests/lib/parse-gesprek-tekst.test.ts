import { describe, expect, it } from "vitest";
import { parseGesprekParagrafen } from "@/lib/parse-gesprek-tekst";

describe("sterrenscores", () => {
  const basis = [
    "4. Inschalen",
    "Beinvloedingskracht: ★★☆☆",
    "Klantgerichtheid: ★★★☆",
    "Ondernemerschap: ★☆☆☆",
    "5. Ontwikkelpaden",
  ];

  it("leest ★ net zo goed als *", () => {
    // De export van deze app schrijft ★ voor gevuld en ☆ voor leeg; oudere
    // formulieren gebruiken asterisken. Beide moeten dezelfde score opleveren.
    const { state } = parseGesprekParagrafen(basis, { regelScheiding: "\n" });
    expect(state.scores).toMatchObject({ b: 2, k: 3, o: 1 });
  });

  it("telt de lege sterren niet mee", () => {
    const { state } = parseGesprekParagrafen(
      ["4. Inschalen", "Klantgerichtheid: ★☆☆☆", "5. Ontwikkelpaden"],
      { regelScheiding: "\n" },
    );
    expect(state.scores?.k).toBe(1);
  });
});
