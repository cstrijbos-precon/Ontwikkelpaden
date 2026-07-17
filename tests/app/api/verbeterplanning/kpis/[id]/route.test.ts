import { describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "@/app/api/verbeterplanning/kpis/[id]/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ hasDatabase: vi.fn() }));
vi.mock("@/lib/verbeterplanning/kpis", () => ({
  deleteKpi: vi.fn(),
  updateKpi: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import { KpiNotFoundError } from "@/lib/verbeterplanning/errors";
import { deleteKpi, updateKpi } from "@/lib/verbeterplanning/kpis";

function ctx() {
  return { params: Promise.resolve({ id: "kpi1" }) };
}
function req(body: unknown) {
  return new Request("http://x", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/verbeterplanning/kpis/[id]", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    expect((await PATCH(req({ description: "X" }), ctx())).status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    expect((await PATCH(req({ description: "X" }), ctx())).status).toBe(503);
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

  it("returns 400 for an unknown field (.strict())", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    expect((await PATCH(req({ nope: true }), ctx())).status).toBe(400);
  });

  it("returns 404 when missing", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(updateKpi).mockRejectedValue(new KpiNotFoundError());
    expect((await PATCH(req({ description: "X" }), ctx())).status).toBe(404);
  });

  it("updates on a valid body", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(updateKpi).mockResolvedValue({
      id: "kpi1",
      projectCode: "KMO01",
      type: "resultaat",
      description: "X",
    });
    expect((await PATCH(req({ description: "X" }), ctx())).status).toBe(200);
  });
});

describe("DELETE /api/verbeterplanning/kpis/[id]", () => {
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
    vi.mocked(deleteKpi).mockRejectedValue(new KpiNotFoundError());
    expect((await DELETE(new Request("http://x"), ctx())).status).toBe(404);
  });

  it("returns 204 on success", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(deleteKpi).mockResolvedValue(undefined);
    expect((await DELETE(new Request("http://x"), ctx())).status).toBe(204);
  });
});
