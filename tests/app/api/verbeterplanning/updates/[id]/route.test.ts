import { describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "@/app/api/verbeterplanning/updates/[id]/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ hasDatabase: vi.fn() }));
vi.mock("@/lib/verbeterplanning/updates", () => ({
  deleteUpdate: vi.fn(),
  editUpdate: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import { UpdateNotFoundError } from "@/lib/verbeterplanning/errors";
import { deleteUpdate, editUpdate } from "@/lib/verbeterplanning/updates";

function ctx() {
  return { params: Promise.resolve({ id: "upd1" }) };
}
function req(body: unknown) {
  return new Request("http://x", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/verbeterplanning/updates/[id]", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    expect((await PATCH(req({ text: "X" }), ctx())).status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    expect((await PATCH(req({ text: "X" }), ctx())).status).toBe(503);
  });

  it("returns 400 for invalid JSON", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    const res = await PATCH(
      new Request("http://x", { method: "PATCH", body: "not-json{" }),
      ctx(),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for an empty text", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    expect((await PATCH(req({ text: "" }), ctx())).status).toBe(400);
  });

  it("returns 404 when missing", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(editUpdate).mockRejectedValue(new UpdateNotFoundError());
    expect((await PATCH(req({ text: "X" }), ctx())).status).toBe(404);
  });

  it("updates on a valid body", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(editUpdate).mockResolvedValue({
      id: "upd1",
      text: "X",
      createdBy: "u@precon.nl",
      createdAt: "2026-01-01T00:00:00Z",
    });
    expect((await PATCH(req({ text: "X" }), ctx())).status).toBe(200);
  });
});

describe("DELETE /api/verbeterplanning/updates/[id]", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    expect((await DELETE(new Request("http://x"), ctx())).status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    expect((await DELETE(new Request("http://x"), ctx())).status).toBe(503);
  });

  it("returns 404 when missing", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(deleteUpdate).mockRejectedValue(new UpdateNotFoundError());
    expect((await DELETE(new Request("http://x"), ctx())).status).toBe(404);
  });

  it("returns 204 on success", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(deleteUpdate).mockResolvedValue(undefined);
    expect((await DELETE(new Request("http://x"), ctx())).status).toBe(204);
  });
});
