import { describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/verbeterplanning/projects/[code]/status/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ hasDatabase: vi.fn() }));
vi.mock("@/lib/verbeterplanning/projects", () => ({
  setProjectMonthStatus: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import { ProjectNotFoundError } from "@/lib/verbeterplanning/errors";
import { setProjectMonthStatus } from "@/lib/verbeterplanning/projects";

function ctx() {
  return { params: Promise.resolve({ code: "KMO01" }) };
}
function req(body: unknown) {
  return new Request("http://x", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/verbeterplanning/projects/[code]/status", () => {
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

  it("returns 400 for an out-of-range month index", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    expect(
      (await PATCH(req({ monthIndex: 99, status: "green" }), ctx())).status,
    ).toBe(400);
  });

  it("returns 400 for an invalid status", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    expect(
      (await PATCH(req({ monthIndex: 0, status: "blue" }), ctx())).status,
    ).toBe(400);
  });

  it("returns 404 for an unknown project", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(setProjectMonthStatus).mockRejectedValue(
      new ProjectNotFoundError(),
    );
    expect(
      (await PATCH(req({ monthIndex: 0, status: "green" }), ctx())).status,
    ).toBe(404);
  });

  it("sets the status on a valid body", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(setProjectMonthStatus).mockResolvedValue(undefined);

    const res = await PATCH(req({ monthIndex: 5, status: "purple" }), ctx());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ monthIndex: 5, status: "purple" });
  });
});
