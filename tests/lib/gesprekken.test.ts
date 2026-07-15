import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGesprek,
  GesprekNotCompletedError,
  getGesprekById,
  listGesprekken,
  startNewCycle,
  updateGesprek,
} from "@/lib/gesprekken";
import { createInitialState } from "@/lib/initial-state";

const sqlMock = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
}));

function gesprekRow(overrides: Record<string, unknown> = {}) {
  const state = createInitialState();
  state.naam = "Jan";
  return {
    id: "gesprek-1",
    medewerker_naam: "Jan",
    medewerker_email: "jan@precon.nl",
    bij_precon_sinds: "2020",
    gesprek_datum: "2024-01-15",
    datum_vorig: null,
    datum_volgend: null,
    hoofdbeoordelaar: "Lead",
    medebeoordelaar: "",
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
