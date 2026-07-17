import { describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/verbeterplanning/kpis/[id]/note/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ hasDatabase: vi.fn() }));
vi.mock("@/lib/verbeterplanning/kpis", () => ({ setKpiQuarterNote: vi.fn() }));

import { hasDatabase } from "@/lib/db";
import { KpiNotFoundError } from "@/lib/verbeterplanning/errors";
import { setKpiQuarterNote } from "@/lib/verbeterplanning/kpis";

function ctx() {
  return { params: Promise.resolve({ id: "kpi1" }) };
}
function req(body: unknown) {
  return new Request("http://x", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/verbeterplanning/kpis/[id]/note", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    expect(
      (await PATCH(req({ quarterIndex: 0, note: "x" }), ctx())).status,
    ).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    expect(
      (await PATCH(req({ quarterIndex: 0, note: "x" }), ctx())).status,
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
    vi.mocked(setKpiQuarterNote).mockRejectedValue(new KpiNotFoundError());
    expect(
      (await PATCH(req({ quarterIndex: 0, note: "x" }), ctx())).status,
    ).toBe(404);
  });

  it("sets the note on a valid body", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(setKpiQuarterNote).mockResolvedValue(undefined);
    expect(
      (await PATCH(req({ quarterIndex: 0, note: "opmerking" }), ctx())).status,
    ).toBe(200);
  });
});
