import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/verbeterplanning/projects/[code]/milestones/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ hasDatabase: vi.fn() }));
vi.mock("@/lib/verbeterplanning/milestones", () => ({
  createMilestone: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import {
  MilestoneLimitError,
  ProjectNotFoundError,
} from "@/lib/verbeterplanning/errors";
import { createMilestone } from "@/lib/verbeterplanning/milestones";

function ctx() {
  return { params: Promise.resolve({ code: "KMO01" }) };
}
function req(body: unknown) {
  return new Request("http://x", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/verbeterplanning/projects/[code]/milestones", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    expect((await POST(req({ name: "X" }), ctx())).status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    expect((await POST(req({ name: "X" }), ctx())).status).toBe(503);
  });

  it("returns 400 for an empty name", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    expect((await POST(req({ name: "" }), ctx())).status).toBe(400);
  });

  it("returns 404 for an unknown project", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(createMilestone).mockRejectedValue(new ProjectNotFoundError());
    expect((await POST(req({ name: "X" }), ctx())).status).toBe(404);
  });

  it("returns 409 at the milestone cap", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(createMilestone).mockRejectedValue(new MilestoneLimitError());
    expect((await POST(req({ name: "X" }), ctx())).status).toBe(409);
  });

  it("creates a milestone on a valid body", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(createMilestone).mockResolvedValue({
      id: "ms1",
      projectCode: "KMO01",
      name: "X",
    });

    const res = await POST(req({ name: "X" }), ctx());
    expect(res.status).toBe(201);
    expect((await res.json()).id).toBe("ms1");
  });
});
