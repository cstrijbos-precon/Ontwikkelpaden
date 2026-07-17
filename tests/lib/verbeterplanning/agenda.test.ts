import { beforeEach, describe, expect, it, vi } from "vitest";

const sqlMock = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
}));

import { setAgendaField } from "@/lib/verbeterplanning/agenda";

describe("setAgendaField", () => {
  beforeEach(() => sqlMock.mockReset());

  it("upserts a single field, keeping other fields from the existing row", async () => {
    sqlMock
      .mockResolvedValueOnce([
        {
          month_index: 0,
          datum: "1 juni",
          projecten: "KMO01",
          opmerkingen: "",
        },
      ])
      .mockResolvedValueOnce([
        {
          month_index: 0,
          datum: "1 juni",
          projecten: "KMO01, KMO02",
          opmerkingen: "",
        },
      ]);

    const entry = await setAgendaField(0, "u@precon.nl", {
      projecten: "KMO01, KMO02",
    });
    expect(entry.datum).toBe("1 juni");
    expect(entry.projecten).toBe("KMO01, KMO02");
  });

  it("defaults missing fields to empty strings when no row exists yet", async () => {
    sqlMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { month_index: 5, datum: "10 juli", projecten: "", opmerkingen: "" },
      ]);

    const entry = await setAgendaField(5, "u@precon.nl", { datum: "10 juli" });
    expect(entry.datum).toBe("10 juli");
    expect(entry.projecten).toBe("");
  });
});
