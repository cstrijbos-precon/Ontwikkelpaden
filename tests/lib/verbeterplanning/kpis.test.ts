import { beforeEach, describe, expect, it, vi } from "vitest";

const sqlMock = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
}));

import {
  KpiLimitError,
  KpiNotFoundError,
  ProjectNotFoundError,
} from "@/lib/verbeterplanning/errors";
import {
  createKpi,
  deleteKpi,
  setKpiQuarterNote,
  setKpiQuarterStatus,
  updateKpi,
} from "@/lib/verbeterplanning/kpis";

describe("createKpi", () => {
  beforeEach(() => sqlMock.mockReset());

  it("throws ProjectNotFoundError for an unknown project", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(
      createKpi("MISSING", "u@precon.nl", "resultaat", ""),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("throws KpiLimitError at the cap", async () => {
    sqlMock
      .mockResolvedValueOnce([{ code: "KMO01" }])
      .mockResolvedValueOnce([{ count: 4, max_sort: 40 }]);
    await expect(
      createKpi("KMO01", "u@precon.nl", "resultaat", ""),
    ).rejects.toBeInstanceOf(KpiLimitError);
  });

  it("creates a kpi below the cap", async () => {
    sqlMock
      .mockResolvedValueOnce([{ code: "KMO01" }])
      .mockResolvedValueOnce([{ count: 1, max_sort: 10 }])
      .mockResolvedValueOnce([
        {
          id: "kpi1",
          project_code: "KMO01",
          type: "resultaat",
          description: "",
        },
      ]);

    const kpi = await createKpi("KMO01", "u@precon.nl", "resultaat", "");
    expect(kpi.id).toBe("kpi1");
  });
});

describe("updateKpi", () => {
  beforeEach(() => sqlMock.mockReset());

  it("throws KpiNotFoundError when missing", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(
      updateKpi("missing", { description: "x" }),
    ).rejects.toBeInstanceOf(KpiNotFoundError);
  });

  it("merges the patch onto existing fields", async () => {
    sqlMock
      .mockResolvedValueOnce([
        {
          id: "kpi1",
          project_code: "KMO01",
          type: "resultaat",
          description: "oud",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "kpi1",
          project_code: "KMO01",
          type: "activiteit",
          description: "oud",
        },
      ]);

    const kpi = await updateKpi("kpi1", { type: "activiteit" });
    expect(kpi.type).toBe("activiteit");
    expect(kpi.description).toBe("oud");
  });
});

describe("deleteKpi", () => {
  beforeEach(() => sqlMock.mockReset());

  it("throws KpiNotFoundError when missing", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(deleteKpi("missing")).rejects.toBeInstanceOf(KpiNotFoundError);
  });

  it("deletes an existing kpi", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "kpi1" }]);
    await expect(deleteKpi("kpi1")).resolves.toBeUndefined();
  });
});

describe("setKpiQuarterStatus / setKpiQuarterNote", () => {
  beforeEach(() => sqlMock.mockReset());

  it("throws KpiNotFoundError for status when missing", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(
      setKpiQuarterStatus("missing", "u@precon.nl", 0, "green"),
    ).rejects.toBeInstanceOf(KpiNotFoundError);
  });

  it("deletes the status row when status is empty", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "kpi1" }]).mockResolvedValueOnce([]);
    await setKpiQuarterStatus("kpi1", "u@precon.nl", 0, "");
    expect(sqlMock).toHaveBeenCalledTimes(2);
  });

  it("upserts a non-empty status", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "kpi1" }]).mockResolvedValueOnce([]);
    await setKpiQuarterStatus("kpi1", "u@precon.nl", 0, "red");
    expect(sqlMock).toHaveBeenCalledTimes(2);
  });

  it("throws KpiNotFoundError for note when missing", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(
      setKpiQuarterNote("missing", "u@precon.nl", 0, "tekst"),
    ).rejects.toBeInstanceOf(KpiNotFoundError);
  });

  it("deletes the note row when note is empty", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "kpi1" }]).mockResolvedValueOnce([]);
    await setKpiQuarterNote("kpi1", "u@precon.nl", 0, "");
    expect(sqlMock).toHaveBeenCalledTimes(2);
  });

  it("upserts a non-empty note independent of status", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "kpi1" }]).mockResolvedValueOnce([]);
    await setKpiQuarterNote("kpi1", "u@precon.nl", 0, "tekst");
    expect(sqlMock).toHaveBeenCalledTimes(2);
  });
});
