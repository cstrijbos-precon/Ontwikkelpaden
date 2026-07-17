import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/verbeterplanning/projects/[code]/kpis/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ hasDatabase: vi.fn() }));
vi.mock("@/lib/verbeterplanning/kpis", () => ({ createKpi: vi.fn() }));

import { hasDatabase } from "@/lib/db";
import {
  KpiLimitError,
  ProjectNotFoundError,
} from "@/lib/verbeterplanning/errors";
import { createKpi } from "@/lib/verbeterplanning/kpis";

function ctx() {
  return { params: Promise.resolve({ code: "KMO01" }) };
}
function req(body: unknown) {
  return new Request("http://x", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/verbeterplanning/projects/[code]/kpis", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    expect((await POST(req({ type: "resultaat" }), ctx())).status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    expect((await POST(req({ type: "resultaat" }), ctx())).status).toBe(503);
  });

  it("returns 400 for invalid JSON", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    const res = await POST(
      new Request("http://x", { method: "POST", body: "not-json{" }),
      ctx(),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid type", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    expect((await POST(req({ type: "onbekend" }), ctx())).status).toBe(400);
  });

  it("returns 404 for an unknown project", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(createKpi).mockRejectedValue(new ProjectNotFoundError());
    expect((await POST(req({ type: "resultaat" }), ctx())).status).toBe(404);
  });

  it("returns 409 at the kpi cap", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(createKpi).mockRejectedValue(new KpiLimitError());
    expect((await POST(req({ type: "resultaat" }), ctx())).status).toBe(409);
  });

  it("creates a kpi on a valid body", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(createKpi).mockResolvedValue({
      id: "kpi1",
      projectCode: "KMO01",
      type: "resultaat",
      description: "",
    });

    const res = await POST(req({ type: "resultaat" }), ctx());
    expect(res.status).toBe(201);
    expect((await res.json()).id).toBe("kpi1");
  });
});
