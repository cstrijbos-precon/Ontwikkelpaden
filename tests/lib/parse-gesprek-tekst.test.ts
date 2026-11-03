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

  it("leest '4 augustus 2026', voluit met spaties zoals iemand het met de hand typt", () => {
    // Kwam voor in een echt ingeleverd verslag: zowel Datum als Datum vorig
    // gesprek stonden zo geschreven, en kwamen daardoor allebei leeg binnen.
    const { state } = parseGesprekParagrafen(
      ["Datum", "4 augustus 2026", "Datum vorig gesprek", "9 augustus 2025"],
      { regelScheiding: "\n" },
    );
    expect(state.datum).toBe("2026-08-04");
    expect(state.datumVorig).toBe("2025-08-09");
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

describe("scores die niet te lezen zijn", () => {
  const maarTwee = [
    "4. Inschalen",
    "Beinvloedingskracht: ★★☆☆",
    "Klantgerichtheid: ★★★☆",
    "5. Ontwikkelpaden",
  ];

  it("meldt per competentie waarvan de score ontbreekt dat die handmatig moet", () => {
    const { warnings } = parseGesprekParagrafen(maarTwee, {
      regelScheiding: "\n",
    });

    expect(warnings).toContain(
      'Score voor "Ondernemerschap" niet gevonden in het bestand — vul deze handmatig in.',
    );
    expect(warnings).toContain(
      'Score voor "Organisatievermogen" niet gevonden in het bestand — vul deze handmatig in.',
    );
    expect(warnings).toContain(
      'Score voor "Training en coaching" niet gevonden in het bestand — vul deze handmatig in.',
    );
    expect(warnings.join(" ")).not.toContain("Klantgerichtheid");
  });

  it("meldt een onduidelijke score maar één keer", () => {
    const { warnings } = parseGesprekParagrafen(
      ["4. Inschalen", "Beinvloedingskracht: ★★ ★★★", "5. Ontwikkelpaden"],
      { regelScheiding: "\n" },
    );

    const overBeinvloeding = warnings.filter(
      (w) =>
        w.includes("Beïnvloedingskracht") || w.includes("Beinvloedingskracht"),
    );
    expect(overBeinvloeding.length).toBeLessThanOrEqual(1);
  });

  it("levert een resultaat op dat zonder fout in een gesprek past (regressie)", async () => {
    // Dit gaf bij een collega een ruwe lijst validatiefouten ("expected number,
    // received NaN") in plaats van een gesprek met de gelezen scores.
    const { mergeWithInitialState } = await import("@/lib/initial-state");
    const { state } = parseGesprekParagrafen(maarTwee, {
      regelScheiding: "\n",
    });

    const gesprek = mergeWithInitialState(state);
    expect(gesprek.scores).toEqual({ b: 2, k: 3, o: 0, org: 0, t: 0 });
  });
});

describe("T-profiel", () => {
  const opties = { regelScheiding: "\n\n" };
  const formulier = (midden: string[]) => [
    "4. Inschalen",
    "Toelichting:",
    "Toelichting bij de competenties",
    "T-profiel",
    "Teken met oranje blokjes het T-profiel in zoals het nu is.",
    ...midden,
    "5. Ontwikkelpaden",
  ];

  it("neemt een diepte over meerdere alinea's volledig mee", () => {
    const { state } = parseGesprekParagrafen(
      formulier([
        "Diepte:",
        "Belastingrecht",
        "En ook jaarrekeningen",
        "Breedte:",
        "HR en sales",
      ]),
      opties,
    );
    expect(state.tDiepte).toBe("Belastingrecht\n\nEn ook jaarrekeningen");
    expect(state.tBreedte).toBe("HR en sales");
  });

  it("leest tekst die op dezelfde regel als het label staat", () => {
    const { state } = parseGesprekParagrafen(
      formulier(["Diepte: Belastingrecht", "Breedte: HR en sales"]),
      opties,
    );
    expect(state.tDiepte).toBe("Belastingrecht");
    expect(state.tBreedte).toBe("HR en sales");
  });

  it("neemt de toelichting onder het T-profiel mee, niet die onder de competenties", () => {
    const { state } = parseGesprekParagrafen(
      formulier(["Toelichting:", "Ik ben T-vormig", "Diepte:", "Recht"]),
      opties,
    );
    expect(state.tToelichting).toBe("Ik ben T-vormig");
    expect(state.tDiepte).toBe("Recht");
  });

  it("neemt T-profiel ontwikkeling over meerdere alinea's mee", () => {
    const { state } = parseGesprekParagrafen(
      [
        "7. Ontwikkeling",
        "T-profiel ontwikkeling:",
        "Meer breedte in sales",
        "En verdieping in recht",
        "Welke zaken uit de toolbox(en) ga jij doen?",
      ],
      opties,
    );
    expect(state.tProfielOntwikkeling).toBe(
      "Meer breedte in sales\n\nEn verdieping in recht",
    );
  });
});

describe("Support-formulier (F-19)", () => {
  const opties = { regelScheiding: "\n\n" };
  const support = [
    "Kerncompetenties: Gebruik de “Précon Ontwikkelpadengids Support” (A-06-2) ter ondersteuning",
    "2. Reflecteren op praktijksituaties",
    "Situatie 3",
    "Dit was de derde situatie",
    "Afspraken uit het vorige gesprek",
    "Cursus afgerond",
    "Overig",
    "Inwerkschema afgerond en opgestuurd naar Esther van Kouwen?",
    "Ja, verstuurd",
    "3. Jouw profiel",
    "4. Inschalen",
    "Beïnvloedingskracht: **",
    "Klantgerichtheid: ***",
    "Ondernemerschap: *",
    "Organisatievermogen: **",
    "5. Ontwikkelpaden",
  ];

  it("herkent het formulier en zet de wereld op Support", () => {
    const { state, warnings } = parseGesprekParagrafen(support, opties);
    expect(state.wereld).toBe("Support");
    expect(warnings.join(" ")).toContain("Support-formulier");
  });

  it("leest afspraken en overig in eigen veld, niet als deel van situatie 3", () => {
    const { state } = parseGesprekParagrafen(support, opties);
    expect(state.situaties?.[2]).toBe("Dit was de derde situatie");
    expect(state.afspraken).toBe("Cursus afgerond");
    expect(state.checks).toContain("Ja, verstuurd");
  });

  it("meldt geen ontbrekende score voor Training en coaching", () => {
    const { state, warnings } = parseGesprekParagrafen(support, opties);
    expect(state.scores).toMatchObject({ b: 2, k: 3, o: 1, org: 2 });
    expect(warnings.join(" ")).not.toContain("Training en coaching");
  });

  it("laat de wereld met rust bij het standaardformulier", () => {
    const { state } = parseGesprekParagrafen(
      ["4. Inschalen", "Klantgerichtheid: **", "5. Ontwikkelpaden"],
      opties,
    );
    expect(state.wereld).toBeUndefined();
  });
});
