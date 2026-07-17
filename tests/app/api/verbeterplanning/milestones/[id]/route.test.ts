import { describe, expect, it, vi } from "vitest";
import {
  DELETE,
  PATCH,
} from "@/app/api/verbeterplanning/milestones/[id]/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ hasDatabase: vi.fn() }));
vi.mock("@/lib/verbeterplanning/milestones", () => ({
  deleteMilestone: vi.fn(),
  renameMilestone: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import { MilestoneNotFoundError } from "@/lib/verbeterplanning/errors";
import {
  deleteMilestone,
  renameMilestone,
} from "@/lib/verbeterplanning/milestones";

function ctx() {
  return { params: Promise.resolve({ id: "ms1" }) };
}
function req(body: unknown) {
  return new Request("http://x", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/verbeterplanning/milestones/[id]", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    expect((await PATCH(req({ name: "X" }), ctx())).status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    expect((await PATCH(req({ name: "X" }), ctx())).status).toBe(503);
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

  it("returns 404 when missing", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(renameMilestone).mockRejectedValue(new MilestoneNotFoundError());
    expect((await PATCH(req({ name: "X" }), ctx())).status).toBe(404);
  });

  it("renames on a valid body", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(renameMilestone).mockResolvedValue({
      id: "ms1",
      projectCode: "KMO01",
      name: "X",
    });
    expect((await PATCH(req({ name: "X" }), ctx())).status).toBe(200);
  });
});

describe("DELETE /api/verbeterplanning/milestones/[id]", () => {
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
    vi.mocked(deleteMilestone).mockRejectedValue(new MilestoneNotFoundError());
    expect((await DELETE(new Request("http://x"), ctx())).status).toBe(404);
  });

  it("returns 204 on success", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(deleteMilestone).mockResolvedValue(undefined);
    expect((await DELETE(new Request("http://x"), ctx())).status).toBe(204);
  });
});
