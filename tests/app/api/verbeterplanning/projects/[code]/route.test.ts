import { describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/verbeterplanning/projects/[code]/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ hasDatabase: vi.fn() }));
vi.mock("@/lib/verbeterplanning/projects", () => ({
  updateProjectMeta: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import { ProjectNotFoundError } from "@/lib/verbeterplanning/errors";
import { updateProjectMeta } from "@/lib/verbeterplanning/projects";

function ctx(code = "KMO01") {
  return { params: Promise.resolve({ code }) };
}
function req(body: unknown) {
  return new Request("http://x", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/verbeterplanning/projects/[code]", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    expect((await PATCH(req({}), ctx())).status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    expect((await PATCH(req({}), ctx())).status).toBe(503);
  });

  it("returns 400 for an unknown field (.strict())", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    expect((await PATCH(req({ nope: true }), ctx())).status).toBe(400);
  });

  it("returns 404 when the project doesn't exist", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(updateProjectMeta).mockRejectedValue(new ProjectNotFoundError());
    expect((await PATCH(req({ title: "X" }), ctx("MISSING"))).status).toBe(404);
  });

  it("updates the project on a valid body", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(updateProjectMeta).mockResolvedValue({
      code: "KMO01",
      title: "Nieuw",
      mtlid: "",
      trekker: "",
      team: "",
      rg: "",
      kpi: "",
      group: "Impact improvement",
    });

    const res = await PATCH(req({ title: "Nieuw" }), ctx());
    expect(res.status).toBe(200);
    expect((await res.json()).title).toBe("Nieuw");
  });
});
