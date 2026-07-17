import { describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/verbeterplanning/milestones/[id]/status/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ hasDatabase: vi.fn() }));
vi.mock("@/lib/verbeterplanning/milestones", () => ({
  setMilestoneMonthStatus: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import { MilestoneNotFoundError } from "@/lib/verbeterplanning/errors";
import { setMilestoneMonthStatus } from "@/lib/verbeterplanning/milestones";

function ctx() {
  return { params: Promise.resolve({ id: "ms1" }) };
}
function req(body: unknown) {
  return new Request("http://x", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/verbeterplanning/milestones/[id]/status", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    expect(
      (await PATCH(req({ monthIndex: 0, status: "green" }), ctx())).status,
    ).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    expect(
      (await PATCH(req({ monthIndex: 0, status: "green" }), ctx())).status,
    ).toBe(503);
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
    vi.mocked(setMilestoneMonthStatus).mockRejectedValue(
      new MilestoneNotFoundError(),
    );
    expect(
      (await PATCH(req({ monthIndex: 0, status: "green" }), ctx())).status,
    ).toBe(404);
  });

  it("sets the status on a valid body", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(setMilestoneMonthStatus).mockResolvedValue(undefined);
    expect(
      (await PATCH(req({ monthIndex: 32, status: "red" }), ctx())).status,
    ).toBe(200);
  });
});
