import { beforeEach, describe, expect, it, vi } from "vitest";

const sqlMock = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
}));

import {
  ProjectNotFoundError,
  UpdateNotFoundError,
} from "@/lib/verbeterplanning/errors";
import {
  createUpdate,
  deleteUpdate,
  editUpdate,
} from "@/lib/verbeterplanning/updates";

describe("createUpdate", () => {
  beforeEach(() => sqlMock.mockReset());

  it("throws ProjectNotFoundError for an unknown project", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(
      createUpdate("MISSING", "u@precon.nl", "tekst"),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("creates an update for an existing project", async () => {
    sqlMock.mockResolvedValueOnce([{ code: "KMO01" }]).mockResolvedValueOnce([
      {
        id: "upd1",
        text: "tekst",
        created_by: "u@precon.nl",
        created_at: "2026-01-01T00:00:00Z",
      },
    ]);

    const update = await createUpdate("KMO01", "u@precon.nl", "tekst");
    expect(update.id).toBe("upd1");
    expect(update.text).toBe("tekst");
  });
});

describe("editUpdate", () => {
  beforeEach(() => sqlMock.mockReset());

  it("throws UpdateNotFoundError when missing", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(editUpdate("missing", "nieuw")).rejects.toBeInstanceOf(
      UpdateNotFoundError,
    );
  });

  it("updates the text of an existing update", async () => {
    sqlMock.mockResolvedValueOnce([
      {
        id: "upd1",
        text: "nieuw",
        created_by: "u@precon.nl",
        created_at: "2026-01-01T00:00:00Z",
      },
    ]);
    const update = await editUpdate("upd1", "nieuw");
    expect(update.text).toBe("nieuw");
  });
});

describe("deleteUpdate", () => {
  beforeEach(() => sqlMock.mockReset());

  it("throws UpdateNotFoundError when missing", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await expect(deleteUpdate("missing")).rejects.toBeInstanceOf(
      UpdateNotFoundError,
    );
  });

  it("deletes an existing update", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "upd1" }]);
    await expect(deleteUpdate("upd1")).resolves.toBeUndefined();
  });
});
