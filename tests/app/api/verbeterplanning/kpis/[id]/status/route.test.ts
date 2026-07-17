import { describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/verbeterplanning/kpis/[id]/status/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ hasDatabase: vi.fn() }));
vi.mock("@/lib/verbeterplanning/kpis", () => ({
  setKpiQuarterStatus: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import { KpiNotFoundError } from "@/lib/verbeterplanning/errors";
import { setKpiQuarterStatus } from "@/lib/verbeterplanning/kpis";

function ctx() {
  return { params: Promise.resolve({ id: "kpi1" }) };
}
function req(body: unknown) {
  return new Request("http://x", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/verbeterplanning/kpis/[id]/status", () => {
  it("returns 400 for status 'purple' (not a valid kpi status)", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    expect(
      (await PATCH(req({ quarterIndex: 0, status: "purple" }), ctx())).status,
    ).toBe(400);
  });

  it("returns 404 when missing", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(setKpiQuarterStatus).mockRejectedValue(new KpiNotFoundError());
    expect(
      (await PATCH(req({ quarterIndex: 0, status: "green" }), ctx())).status,
    ).toBe(404);
  });

  it("sets the status on a valid body", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(setKpiQuarterStatus).mockResolvedValue(undefined);
    expect(
      (await PATCH(req({ quarterIndex: 7, status: "amber" }), ctx())).status,
    ).toBe(200);
  });

  it("returns 401 without session", async () => {
    mockAuth(null);
    expect(
      (await PATCH(req({ quarterIndex: 0, status: "green" }), ctx())).status,
    ).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    expect(
      (await PATCH(req({ quarterIndex: 0, status: "green" }), ctx())).status,
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
});
