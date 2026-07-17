import { beforeEach, describe, expect, it, vi } from "vitest";

const sqlMock = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
}));

import {
  MilestoneLimitError,
  MilestoneNotFoundError,
  ProjectNotFoundError,
} from "@/lib/verbeterplanning/errors";
import {
  createMilestone,
  deleteMilestone,
  renameMilestone,
  setMilestoneMonthStatus,
} from "@/lib/verbeterplanning/milestones";

describe("createMilestone", () => {
  beforeEach(() => sqlMock.mockReset());

  it("throws ProjectNotFoundError for an unknown project", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(
      createMilestone("MISSING", "u@precon.nl", "Naam"),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("throws MilestoneLimitError at the cap", async () => {
    sqlMock
      .mockResolvedValueOnce([{ code: "KMO01" }])
      .mockResolvedValueOnce([{ count: 10, max_sort: 100 }]);
    await expect(
      createMilestone("KMO01", "u@precon.nl", "Naam"),
    ).rejects.toBeInstanceOf(MilestoneLimitError);
  });

  it("creates a milestone below the cap", async () => {
    sqlMock
      .mockResolvedValueOnce([{ code: "KMO01" }])
      .mockResolvedValueOnce([{ count: 1, max_sort: 10 }])
      .mockResolvedValueOnce([
        { id: "ms1", project_code: "KMO01", name: "Naam" },
      ]);

    const milestone = await createMilestone("KMO01", "u@precon.nl", "Naam");
    expect(milestone.id).toBe("ms1");
  });
});

describe("renameMilestone", () => {
  beforeEach(() => sqlMock.mockReset());

  it("throws MilestoneNotFoundError when missing", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(renameMilestone("missing", "Nieuw")).rejects.toBeInstanceOf(
      MilestoneNotFoundError,
    );
  });

  it("renames an existing milestone", async () => {
    sqlMock.mockResolvedValueOnce([
      { id: "ms1", project_code: "KMO01", name: "Nieuw" },
    ]);
    const milestone = await renameMilestone("ms1", "Nieuw");
    expect(milestone.name).toBe("Nieuw");
  });
});

describe("deleteMilestone", () => {
  beforeEach(() => sqlMock.mockReset());

  it("throws MilestoneNotFoundError when missing", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(deleteMilestone("missing")).rejects.toBeInstanceOf(
      MilestoneNotFoundError,
    );
  });

  it("deletes an existing milestone", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "ms1" }]);
    await expect(deleteMilestone("ms1")).resolves.toBeUndefined();
  });
});

describe("setMilestoneMonthStatus", () => {
  beforeEach(() => sqlMock.mockReset());

  it("throws MilestoneNotFoundError when missing", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(
      setMilestoneMonthStatus("missing", "u@precon.nl", 0, "green"),
    ).rejects.toBeInstanceOf(MilestoneNotFoundError);
  });

  it("deletes the status row when status is empty", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "ms1" }]).mockResolvedValueOnce([]);
    await setMilestoneMonthStatus("ms1", "u@precon.nl", 0, "");
    expect(sqlMock).toHaveBeenCalledTimes(2);
  });

  it("upserts the status row for a non-empty status", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "ms1" }]).mockResolvedValueOnce([]);
    await setMilestoneMonthStatus("ms1", "u@precon.nl", 0, "purple");
    expect(sqlMock).toHaveBeenCalledTimes(2);
  });
});
