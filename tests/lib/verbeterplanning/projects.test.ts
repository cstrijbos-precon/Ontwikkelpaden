import { beforeEach, describe, expect, it, vi } from "vitest";

const sqlMock = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
}));

import {
  ProjectCodeExistsError,
  ProjectNotFoundError,
} from "@/lib/verbeterplanning/errors";
import {
  createProject,
  setProjectMonthStatus,
  updateProjectMeta,
} from "@/lib/verbeterplanning/projects";

describe("createProject", () => {
  beforeEach(() => sqlMock.mockReset());

  it("throws ProjectCodeExistsError on duplicate code", async () => {
    sqlMock.mockResolvedValueOnce([{ code: "KMO01" }]);
    await expect(
      createProject("u@precon.nl", {
        code: "KMO01",
        title: "Titel",
        group: "Impact improvement",
      }),
    ).rejects.toBeInstanceOf(ProjectCodeExistsError);
  });

  it("creates a project with the next sort_order", async () => {
    sqlMock
      .mockResolvedValueOnce([]) // no existing code
      .mockResolvedValueOnce([{ max_sort: 20 }]) // max sort in group
      .mockResolvedValueOnce([
        {
          code: "KMO09",
          title: "Titel",
          mtlid: "",
          trekker: "",
          team: "",
          rg: "",
          kpi: "",
          group: "Impact improvement",
        },
      ]);

    const project = await createProject("u@precon.nl", {
      code: "KMO09",
      title: "Titel",
      group: "Impact improvement",
    });

    expect(project.code).toBe("KMO09");
  });
});

describe("updateProjectMeta", () => {
  beforeEach(() => sqlMock.mockReset());

  it("throws ProjectNotFoundError when project is missing", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(
      updateProjectMeta("MISSING", "u@precon.nl", { title: "X" }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("merges the patch onto existing fields", async () => {
    sqlMock
      .mockResolvedValueOnce([
        {
          code: "KMO01",
          title: "Oud",
          mtlid: "Ard",
          trekker: "Judith",
          team: "",
          rg: "",
          kpi: "",
          group: "Impact improvement",
        },
      ])
      .mockResolvedValueOnce([
        {
          code: "KMO01",
          title: "Nieuw",
          mtlid: "Ard",
          trekker: "Judith",
          team: "",
          rg: "",
          kpi: "",
          group: "Impact improvement",
        },
      ]);

    const project = await updateProjectMeta("KMO01", "u@precon.nl", {
      title: "Nieuw",
    });
    expect(project.title).toBe("Nieuw");
    expect(project.trekker).toBe("Judith");
  });
});

describe("setProjectMonthStatus", () => {
  beforeEach(() => sqlMock.mockReset());

  it("throws ProjectNotFoundError for an unknown project", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(
      setProjectMonthStatus("MISSING", "u@precon.nl", 0, "green"),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("deletes the status row when status is empty", async () => {
    sqlMock
      .mockResolvedValueOnce([{ code: "KMO01" }])
      .mockResolvedValueOnce([]);
    await setProjectMonthStatus("KMO01", "u@precon.nl", 0, "");
    expect(sqlMock).toHaveBeenCalledTimes(2);
  });

  it("upserts the status row for a non-empty status", async () => {
    sqlMock
      .mockResolvedValueOnce([{ code: "KMO01" }])
      .mockResolvedValueOnce([]);
    await setProjectMonthStatus("KMO01", "u@precon.nl", 0, "green");
    expect(sqlMock).toHaveBeenCalledTimes(2);
  });
});
