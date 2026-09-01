import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BeoordelaarAlGekoppeldError,
  createGesprek,
  GeenToegangError,
  GesprekNotCompletedError,
  getBekendeMedewerkers,
  getDashboardOverzicht,
  getGesprekById,
  getPendingGoedkeuringen,
  listGesprekken,
  MedewerkerNietGevondenError,
  requestBeoordelaarKoppeling,
  respondBeoordelaarKoppeling,
  startNewCycle,
  updateGesprek,
} from "@/lib/gesprekken";
import { createInitialState } from "@/lib/initial-state";

const sqlMock = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
  // findUserByEmail kijkt eerst in de database; die is hier niet ingesteld,
  // dus valt de lookup terug op APP_USERS.
  hasDatabase: () => false,
}));

function gesprekRow(overrides: Record<string, unknown> = {}) {
  const state = createInitialState();
  state.naam = "Jan";
  return {
    id: "gesprek-1",
    medewerker_naam: "Jan",
    medewerker_email: "jan@precon.nl",
    wereld: "QA",
    bij_precon_sinds: "2020",
    gesprek_datum: "2024-01-15",
    datum_vorig: null,
    datum_volgend: null,
    hoofdbeoordelaar: "Lead",
    hoofdbeoordelaar_status: "toegestaan",
    medebeoordelaar: "",
    medebeoordelaar_status: "toegestaan",
    status: "draft",
    state,
    previous_gesprek_id: null,
    created_by: "creator@precon.nl",
    updated_by: "creator@precon.nl",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    ...overrides,
  };
}

describe("listGesprekken", () => {
  beforeEach(() => {
    sqlMock.mockReset();
  });

  it("returns all items for admin", async () => {
    sqlMock.mockResolvedValueOnce([
      {
        id: "1",
        medewerker_naam: "Jan",
        medewerker_email: null,
        gesprek_datum: null,
        status: "draft",
        hoofdbeoordelaar: "",
        updated_at: "2024-01-01",
      },
    ]);

    const items = await listGesprekken("admin@precon.nl", true);
    expect(items).toHaveLength(1);
    expect(items[0]?.medewerkerNaam).toBe("Jan");
  });

  it("scopes list for non-admin", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await listGesprekken("user@precon.nl", false);
    expect(sqlMock).toHaveBeenCalled();
  });
});

describe("getGesprekById", () => {
  beforeEach(() => {
    sqlMock.mockReset();
  });

  it("returns gesprek when user has access", async () => {
    sqlMock.mockResolvedValueOnce([gesprekRow()]);
    const gesprek = await getGesprekById(
      "gesprek-1",
      "creator@precon.nl",
      false,
    );
    expect(gesprek?.id).toBe("gesprek-1");
    expect(gesprek?.medewerkerNaam).toBe("Jan");
  });

  it("returns null when not found", async () => {
    sqlMock.mockResolvedValueOnce([]);
    expect(await getGesprekById("missing", "user@precon.nl", false)).toBeNull();
  });

  it("returns null when access denied", async () => {
    sqlMock.mockResolvedValueOnce([gesprekRow()]);
    expect(
      await getGesprekById("gesprek-1", "other@precon.nl", false),
    ).toBeNull();
  });

  it("returns gesprek when user is the hoofdbeoordelaar", async () => {
    sqlMock.mockResolvedValueOnce([
      gesprekRow({ hoofdbeoordelaar: "lead@precon.nl" }),
    ]);
    const gesprek = await getGesprekById("gesprek-1", "Lead@Precon.nl", false);
    expect(gesprek?.id).toBe("gesprek-1");
  });

  it("returns gesprek when user is the medebeoordelaar", async () => {
    sqlMock.mockResolvedValueOnce([
      gesprekRow({ medebeoordelaar: "mede@precon.nl" }),
    ]);
    const gesprek = await getGesprekById("gesprek-1", "mede@precon.nl", false);
    expect(gesprek?.id).toBe("gesprek-1");
  });
});

describe("createGesprek", () => {
  beforeEach(() => {
    sqlMock.mockReset();
  });

  it("inserts gesprek and syncs extract tables", async () => {
    sqlMock.mockResolvedValueOnce([gesprekRow()]).mockResolvedValue([]);

    const gesprek = await createGesprek("creator@precon.nl");
    expect(gesprek.id).toBe("gesprek-1");
    expect(sqlMock.mock.calls.length).toBeGreaterThan(1);
  });

  it("throws when insert returns no row", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(createGesprek("creator@precon.nl")).rejects.toThrow(
      "Failed to create gesprek",
    );
  });

  it("respecteert een expliciet meegegeven status (bv. archived bij upload)", async () => {
    sqlMock
      .mockResolvedValueOnce([gesprekRow({ status: "archived" })])
      .mockResolvedValue([]);

    const gesprek = await createGesprek(
      "jan@precon.nl",
      undefined,
      "jan@precon.nl",
      undefined,
      "archived",
    );

    expect(gesprek.status).toBe("archived");
    const insertCall = sqlMock.mock.calls[0];
    expect(insertCall).toContain("archived");
  });

  it("persisteert wereld en berekent huidig_niveau per pad in gesprek_paden", async () => {
    sqlMock.mockResolvedValueOnce([gesprekRow()]).mockResolvedValue([]);

    const state = createInitialState();
    state.naam = "Jan";
    state.wereld = "RA";
    state.scores = { b: 1, k: 1, o: 1, org: 1, t: 0 };

    await createGesprek("creator@precon.nl", state);

    const insertGesprekCall = sqlMock.mock.calls[0];
    expect(insertGesprekCall).toContain("RA");

    const insertPadenCall = sqlMock.mock.calls.find(
      (call) =>
        (call[0] as TemplateStringsArray)
          .join("")
          .includes("INSERT INTO gesprek_paden") && call.includes("vakexpert"),
    );
    expect(insertPadenCall).toContain(1);
  });
});

describe("updateGesprek", () => {
  beforeEach(() => {
    sqlMock.mockReset();
  });

  it("updates existing gesprek", async () => {
    const row = gesprekRow();
    sqlMock
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([row])
      .mockResolvedValue([]);

    const nextState = createInitialState();
    nextState.naam = "Piet";
    const updated = await updateGesprek(
      "gesprek-1",
      "creator@precon.nl",
      false,
      nextState,
    );
    expect(updated?.state.naam).toBe("Jan");
  });

  it("returns null when gesprek not accessible", async () => {
    sqlMock.mockResolvedValueOnce([gesprekRow()]);
    const result = await updateGesprek(
      "gesprek-1",
      "other@precon.nl",
      false,
      createInitialState(),
    );
    expect(result).toBeNull();
  });

  it("zet hoofdbeoordelaar_status naar toegestaan als de medewerker zelf een nieuw adres invult", async () => {
    const existingRow = gesprekRow({
      hoofdbeoordelaar: "oud@precon.nl",
      hoofdbeoordelaar_status: "in_afwachting",
    });
    sqlMock
      .mockResolvedValueOnce([existingRow])
      .mockResolvedValueOnce([existingRow])
      .mockResolvedValue([]);

    const nextState = createInitialState();
    nextState.naam = "Jan";
    nextState.hoofdbeoordelaar = "nieuw@precon.nl";

    await updateGesprek("gesprek-1", "creator@precon.nl", false, nextState);

    const updateCall = sqlMock.mock.calls.find((call) =>
      (call[0] as TemplateStringsArray)
        .join("")
        .includes("UPDATE gesprekken SET"),
    );
    expect(updateCall).toContain("toegestaan");
  });

  it("laat een openstaande hoofdbeoordelaar_status met rust als het adres niet wijzigt", async () => {
    const existingRow = gesprekRow({
      hoofdbeoordelaar: "hoofd@precon.nl",
      hoofdbeoordelaar_status: "in_afwachting",
    });
    sqlMock
      .mockResolvedValueOnce([existingRow])
      .mockResolvedValueOnce([existingRow])
      .mockResolvedValue([]);

    const nextState = createInitialState();
    nextState.naam = "Jan";
    nextState.hoofdbeoordelaar = "hoofd@precon.nl";

    await updateGesprek("gesprek-1", "creator@precon.nl", false, nextState);

    const updateCall = sqlMock.mock.calls.find((call) =>
      (call[0] as TemplateStringsArray)
        .join("")
        .includes("UPDATE gesprekken SET"),
    );
    expect(updateCall).toContain("in_afwachting");
  });

  it("persisteert de wereld uit de state", async () => {
    const row = gesprekRow();
    sqlMock
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([row])
      .mockResolvedValue([]);

    const nextState = createInitialState();
    nextState.naam = "Jan";
    nextState.wereld = "Learning";

    await updateGesprek("gesprek-1", "creator@precon.nl", false, nextState);

    const updateCall = sqlMock.mock.calls.find((call) =>
      (call[0] as TemplateStringsArray)
        .join("")
        .includes("UPDATE gesprekken SET"),
    );
    expect(updateCall).toContain("Learning");
  });
});

describe("requestBeoordelaarKoppeling", () => {
  const origineleUsers = process.env.APP_USERS;
  const origineleDomeinen = process.env.APP_EMAIL_DOMEINEN;

  // Een geldig bcrypt-formaat is genoeg; parseAppUsers kijkt alleen naar $2.
  const hash = `$2b$12${"$"}${"x".repeat(53)}`;

  beforeEach(() => {
    sqlMock.mockReset();
    process.env.APP_EMAIL_DOMEINEN = "precon.nl";
    process.env.APP_USERS = "";
  });

  afterEach(() => {
    process.env.APP_USERS = origineleUsers;
    process.env.APP_EMAIL_DOMEINEN = origineleDomeinen;
  });

  it("wacht op akkoord als de medewerker al een account heeft", async () => {
    process.env.APP_USERS = `jan@precon.nl:${hash}`;
    const row = gesprekRow({ hoofdbeoordelaar: "" });
    sqlMock.mockResolvedValueOnce([row]).mockResolvedValueOnce([
      {
        ...row,
        hoofdbeoordelaar: "beoordelaar@precon.nl",
        hoofdbeoordelaar_status: "in_afwachting",
      },
    ]);

    await requestBeoordelaarKoppeling(
      "jan@precon.nl",
      "hoofdbeoordelaar",
      "beoordelaar@precon.nl",
    );

    const updateCall = sqlMock.mock.calls.find((call) =>
      (call[0] as TemplateStringsArray).join("").includes("UPDATE gesprekken"),
    );
    expect(updateCall).toContain("in_afwachting");
  });

  it("schrijft de beoordelaar ook in state, niet alleen in de kolom", async () => {
    // Het formulier op scherm Gegevens leest uit state. Blijft die leeg, dan
    // schrijft de eerstvolgende autosave de koppeling weer weg.
    process.env.APP_USERS = `jan@precon.nl:${hash}`;
    const row = gesprekRow({ medebeoordelaar: "" });
    sqlMock.mockResolvedValueOnce([row]).mockResolvedValueOnce([
      {
        ...row,
        medebeoordelaar: "beoordelaar@precon.nl",
        medebeoordelaar_status: "in_afwachting",
      },
    ]);

    await requestBeoordelaarKoppeling(
      "jan@precon.nl",
      "medebeoordelaar",
      "beoordelaar@precon.nl",
    );

    const updateCall = sqlMock.mock.calls.find((call) =>
      (call[0] as TemplateStringsArray).join("").includes("UPDATE gesprekken"),
    );
    const sqlTekst = (updateCall?.[0] as TemplateStringsArray).join("");
    expect(sqlTekst).toContain("jsonb_set");
    expect(sqlTekst).toContain("{medebeoordelaar}");
  });

  it("geeft direct toegang als de medewerker nog geen account heeft", async () => {
    // Niemand om toestemming aan te vragen: wachten zou het gesprek blokkeren.
    const row = gesprekRow({ hoofdbeoordelaar: "" });
    sqlMock.mockResolvedValueOnce([row]).mockResolvedValueOnce([
      {
        ...row,
        hoofdbeoordelaar: "beoordelaar@precon.nl",
        hoofdbeoordelaar_status: "toegestaan",
      },
    ]);

    const gesprek = await requestBeoordelaarKoppeling(
      "jan@precon.nl",
      "hoofdbeoordelaar",
      "beoordelaar@precon.nl",
    );

    expect(gesprek.hoofdbeoordelaarStatus).toBe("toegestaan");
    const updateCall = sqlMock.mock.calls.find((call) =>
      (call[0] as TemplateStringsArray).join("").includes("UPDATE gesprekken"),
    );
    expect(updateCall).toContain("toegestaan");
  });

  it("weigert een adres buiten de toegestane domeinen", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(
      requestBeoordelaarKoppeling(
        "vreemde@gmail.com",
        "hoofdbeoordelaar",
        "b@precon.nl",
      ),
    ).rejects.toThrow(MedewerkerNietGevondenError);
  });

  it("start een concept-gesprek voor een collega die nog nooit heeft ingelogd", async () => {
    const nieuweRow = gesprekRow({
      id: "gesprek-nieuw",
      medewerker_email: "nieuw@precon.nl",
      medebeoordelaar: "",
    });

    // createGesprek doet een reeks vervolgqueries; sturen op de inhoud van de
    // query is steviger dan op de volgorde van de aanroepen.
    sqlMock.mockImplementation((strings: TemplateStringsArray) => {
      const query = strings.join(" ");
      if (query.includes("SELECT * FROM gesprekken"))
        return Promise.resolve([]);
      if (query.includes("INSERT INTO gesprekken"))
        return Promise.resolve([nieuweRow]);
      if (query.includes("UPDATE gesprekken SET"))
        return Promise.resolve([
          {
            ...nieuweRow,
            medebeoordelaar: "notulist@precon.nl",
            medebeoordelaar_status: "toegestaan",
          },
        ]);
      return Promise.resolve([]);
    });

    const gesprek = await requestBeoordelaarKoppeling(
      "nieuw@precon.nl",
      "medebeoordelaar",
      "notulist@precon.nl",
    );

    expect(gesprek.medebeoordelaar).toBe("notulist@precon.nl");
    expect(gesprek.medebeoordelaarStatus).toBe("toegestaan");
  });

  it("gooit BeoordelaarAlGekoppeldError als het rol-veld al gevuld is", async () => {
    sqlMock.mockResolvedValueOnce([
      gesprekRow({ hoofdbeoordelaar: "al-iemand@precon.nl" }),
    ]);
    await expect(
      requestBeoordelaarKoppeling(
        "jan@precon.nl",
        "hoofdbeoordelaar",
        "nieuw@precon.nl",
      ),
    ).rejects.toThrow(BeoordelaarAlGekoppeldError);
  });
});

describe("respondBeoordelaarKoppeling", () => {
  beforeEach(() => {
    sqlMock.mockReset();
  });

  it("keurt een verzoek goed als de medewerker zelf dit doet", async () => {
    const row = gesprekRow({
      hoofdbeoordelaar: "hoofd@precon.nl",
      hoofdbeoordelaar_status: "in_afwachting",
    });
    sqlMock
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([
        { ...row, hoofdbeoordelaar_status: "toegestaan" },
      ]);

    const gesprek = await respondBeoordelaarKoppeling(
      "gesprek-1",
      "jan@precon.nl",
      false,
      "hoofdbeoordelaar",
      "goedkeuren",
    );

    expect(gesprek?.hoofdbeoordelaarStatus).toBe("toegestaan");
  });

  it("wijst een verzoek af door het veld leeg te maken", async () => {
    const row = gesprekRow({
      hoofdbeoordelaar: "hoofd@precon.nl",
      hoofdbeoordelaar_status: "in_afwachting",
    });
    sqlMock
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([
        { ...row, hoofdbeoordelaar: "", hoofdbeoordelaar_status: "toegestaan" },
      ]);

    const gesprek = await respondBeoordelaarKoppeling(
      "gesprek-1",
      "jan@precon.nl",
      false,
      "hoofdbeoordelaar",
      "afwijzen",
    );

    expect(gesprek?.hoofdbeoordelaar).toBe("");
  });

  it("gooit GeenToegangError als iemand anders dan de medewerker het probeert", async () => {
    sqlMock.mockResolvedValueOnce([gesprekRow()]);

    await expect(
      respondBeoordelaarKoppeling(
        "gesprek-1",
        "creator@precon.nl",
        false,
        "hoofdbeoordelaar",
        "goedkeuren",
      ),
    ).rejects.toThrow(GeenToegangError);
  });

  it("staat admins ook toe om te reageren", async () => {
    const row = gesprekRow({
      hoofdbeoordelaar: "hoofd@precon.nl",
      hoofdbeoordelaar_status: "in_afwachting",
    });
    sqlMock
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([
        { ...row, hoofdbeoordelaar_status: "toegestaan" },
      ]);

    const gesprek = await respondBeoordelaarKoppeling(
      "gesprek-1",
      "admin@precon.nl",
      true,
      "hoofdbeoordelaar",
      "goedkeuren",
    );
    expect(gesprek?.hoofdbeoordelaarStatus).toBe("toegestaan");
  });

  it("retourneert null als het gesprek niet gevonden/toegankelijk is", async () => {
    sqlMock.mockResolvedValueOnce([]);
    const gesprek = await respondBeoordelaarKoppeling(
      "missing",
      "jan@precon.nl",
      false,
      "hoofdbeoordelaar",
      "goedkeuren",
    );
    expect(gesprek).toBeNull();
  });
});

describe("getBekendeMedewerkers", () => {
  beforeEach(() => {
    sqlMock.mockReset();
  });

  it("geeft naam+e-mail terug, gesorteerd op naam", async () => {
    sqlMock.mockResolvedValueOnce([
      { medewerker_naam: "Zeb", medewerker_email: "zeb@precon.nl" },
      { medewerker_naam: "Alice", medewerker_email: "alice@precon.nl" },
    ]);

    const medewerkers = await getBekendeMedewerkers();
    expect(medewerkers).toEqual([
      { naam: "Alice", email: "alice@precon.nl" },
      { naam: "Zeb", email: "zeb@precon.nl" },
    ]);
  });
});

describe("getPendingGoedkeuringen", () => {
  beforeEach(() => {
    sqlMock.mockReset();
  });

  it("geeft gesprekken met een openstaand verzoek terug", async () => {
    sqlMock.mockResolvedValueOnce([
      {
        id: "gesprek-1",
        medewerker_naam: "Jan",
        medewerker_email: "jan@precon.nl",
        gesprek_datum: "2024-01-15",
        status: "draft",
        hoofdbeoordelaar: "hoofd@precon.nl",
        hoofdbeoordelaar_status: "in_afwachting",
        medebeoordelaar: "",
        medebeoordelaar_status: "toegestaan",
        updated_at: "2024-01-02",
      },
    ]);

    const items = await getPendingGoedkeuringen("jan@precon.nl");
    expect(items).toHaveLength(1);
    expect(items[0]?.hoofdbeoordelaarStatus).toBe("in_afwachting");
  });
});

describe("getDashboardOverzicht", () => {
  beforeEach(() => {
    sqlMock.mockReset();
  });

  it("categoriseert gesprekken in eigen/hoofdbeoordelaar/medebeoordelaar", async () => {
    sqlMock
      .mockResolvedValueOnce([
        {
          id: "1",
          medewerker_naam: "Jan",
          medewerker_email: "jan@precon.nl",
          gesprek_datum: "2024-01-01",
          status: "draft",
          hoofdbeoordelaar: "",
          hoofdbeoordelaar_status: "toegestaan",
          medebeoordelaar: "",
          medebeoordelaar_status: "toegestaan",
          updated_at: "2024-01-01",
        },
        {
          id: "2",
          medewerker_naam: "Piet",
          medewerker_email: "piet@precon.nl",
          gesprek_datum: "2023-01-01",
          status: "completed",
          hoofdbeoordelaar: "jan@precon.nl",
          hoofdbeoordelaar_status: "toegestaan",
          medebeoordelaar: "",
          medebeoordelaar_status: "toegestaan",
          updated_at: "2023-01-01",
        },
      ])
      .mockResolvedValueOnce([]);

    const overzicht = await getDashboardOverzicht("jan@precon.nl", false);

    expect(overzicht.eigen).toHaveLength(1);
    expect(overzicht.eigen[0]?.id).toBe("1");
    expect(overzicht.alsHoofdbeoordelaar).toHaveLength(1);
    expect(overzicht.alsHoofdbeoordelaar[0]?.id).toBe("2");
    expect(overzicht.alsMedebeoordelaar).toHaveLength(0);
    expect(overzicht.pendingGoedkeuringen).toEqual([]);
  });
});

describe("startNewCycle", () => {
  beforeEach(() => {
    sqlMock.mockReset();
  });

  /** Matcht queries op inhoud i.p.v. aanroepvolgorde — robuust tegen extract-table sync-calls. */
  function mockSqlByQuery(existingRow: ReturnType<typeof gesprekRow>) {
    sqlMock.mockImplementation((strings: TemplateStringsArray) => {
      const text = strings.join("");
      if (text.includes("SELECT * FROM gesprekken WHERE id")) {
        return Promise.resolve([existingRow]);
      }
      if (text.includes("UPDATE gesprekken SET")) {
        return Promise.resolve([{ ...existingRow, status: "archived" }]);
      }
      if (text.includes("INSERT INTO gesprekken")) {
        return Promise.resolve([
          gesprekRow({
            id: "gesprek-2",
            status: "draft",
            previous_gesprek_id: existingRow.id,
          }),
        ]);
      }
      return Promise.resolve([]);
    });
  }

  it("archives the completed gesprek and creates a new cycle", async () => {
    const existingRow = gesprekRow({ status: "completed" });
    mockSqlByQuery(existingRow);

    const result = await startNewCycle("gesprek-1", "creator@precon.nl", false);

    expect(result?.id).toBe("gesprek-2");
    expect(result?.previousGesprekId).toBe("gesprek-1");

    const updateCalls = sqlMock.mock.calls.filter((call) =>
      (call[0] as TemplateStringsArray)
        .join("")
        .includes("UPDATE gesprekken SET"),
    );
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toContain("archived");
  });

  it("throws GesprekNotCompletedError when gesprek is still draft", async () => {
    mockSqlByQuery(gesprekRow({ status: "draft" }));

    await expect(
      startNewCycle("gesprek-1", "creator@precon.nl", false),
    ).rejects.toThrow(GesprekNotCompletedError);
  });

  it("returns null when gesprek not found or not accessible", async () => {
    sqlMock.mockResolvedValueOnce([]);
    const result = await startNewCycle("missing", "creator@precon.nl", false);
    expect(result).toBeNull();
  });
});
