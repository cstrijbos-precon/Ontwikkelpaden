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

  it("negeert het voorbeeld in de toelichting boven het formulier", () => {
    // Het echte F-04-formulier legt eerst uit hoe je moet invullen, mét een
    // voorbeeld dat toevallig hetzelfde label gebruikt als de vraag zelf:
    // 'Schrijf het aantal sterren op (bv "Beïnvloedingskracht ***")'. Dat
    // voorbeeld staat middenin een zin, niet aan het begin van de regel — het
    // echte antwoord daaronder staat wél los op zijn eigen regel.
    const { state } = parseGesprekParagrafen(
      [
        "4. Inschalen",
        'Schrijf hieronder per kerncompetentie het aantal sterren (bv "Beïnvloedingskracht ***")',
        "Beinvloedingskracht:___*__",
        "5. Ontwikkelpaden",
      ],
      { regelScheiding: "\n" },
    );
    expect(state.scores?.b).toBe(1);
  });

  it("raadt niets als iemand tussen twee scores twijfelde", () => {
    // Op het echte formulier stond "Beïnvloedingskracht:___*/**__" — een
    // handmatige aantekening tussen 1 en 2 sterren. Geen van beide is de
    // score van de medewerker, dus die wordt niet overgenomen.
    const { state, warnings } = parseGesprekParagrafen(
      ["4. Inschalen", "Beinvloedingskracht:___*/**__", "5. Ontwikkelpaden"],
      { regelScheiding: "\n" },
    );
    expect(state.scores?.b).toBeUndefined();
    expect(warnings.some((w) => w.includes("Beinvloedingskracht"))).toBe(true);
  });
});

describe("datums met maandnaam", () => {
  it("leest '4-aug-2026', zoals Word die automatisch van een cijferdatum maakt", () => {
    const { state } = parseGesprekParagrafen(["Datum", "4-aug-2026"], {
      regelScheiding: "\n",
    });
    expect(state.datum).toBe("2026-08-04");
  });
});

describe("checkpoints", () => {
  it("herkent de vraag naar checkpoints als eigen veld", () => {
    // Stond eerder niet in de markers, waardoor deze tekst bleef plakken aan
    // het veld ervoor (toolboxKeuze).
    const { state } = parseGesprekParagrafen(
      [
        "Welke zaken uit de toolbox(en) ga jij doen om die richting in te groeien?",
        "- Cursus X volgen",
        "Kan je al checkpoints bedenken die je gaat tegenkomen om te reflecteren?",
        "Elk kwartaal een terugkoppeling",
        "8. Eventuele overige afspraken",
      ],
      { regelScheiding: "\n" },
    );
    expect(state.toolboxKeuze).toBe("- Cursus X volgen");
    expect(state.checkpoints).toBe("Elk kwartaal een terugkoppeling");
  });
});

describe("tussentekst boven Jouw profiel", () => {
  it("laat de vaste toelichting niet aan Overige checks plakken", () => {
    const { state } = parseGesprekParagrafen(
      [
        "Overige checks",
        "Portfolio up to date?",
        "Als je al een POP met de ontwikkelpaden hebt, heb je dit waarschijnlijk vorig jaar al ingevuld.",
        "3. Jouw profiel",
        "Inhoudelijk sterk.",
      ],
      { regelScheiding: "\n" },
    );
    expect(state.checks).toBe("Portfolio up to date?");
    expect(state.profiel).toBe("Inhoudelijk sterk.");
  });
});
