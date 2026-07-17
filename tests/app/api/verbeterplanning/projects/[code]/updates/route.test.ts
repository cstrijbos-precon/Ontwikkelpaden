import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/verbeterplanning/projects/[code]/updates/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ hasDatabase: vi.fn() }));
vi.mock("@/lib/verbeterplanning/updates", () => ({ createUpdate: vi.fn() }));

import { hasDatabase } from "@/lib/db";
import { ProjectNotFoundError } from "@/lib/verbeterplanning/errors";
import { createUpdate } from "@/lib/verbeterplanning/updates";

function ctx() {
  return { params: Promise.resolve({ code: "KMO01" }) };
}
function req(body: unknown) {
  return new Request("http://x", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/verbeterplanning/projects/[code]/updates", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    expect((await POST(req({ text: "X" }), ctx())).status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    expect((await POST(req({ text: "X" }), ctx())).status).toBe(503);
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

  it("returns 400 for an empty text", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    expect((await POST(req({ text: "" }), ctx())).status).toBe(400);
  });

  it("returns 404 for an unknown project", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(createUpdate).mockRejectedValue(new ProjectNotFoundError());
    expect((await POST(req({ text: "X" }), ctx())).status).toBe(404);
  });

  it("creates an update on a valid body", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(createUpdate).mockResolvedValue({
      id: "upd1",
      text: "X",
      createdBy: "u@precon.nl",
      createdAt: "2026-01-01T00:00:00Z",
    });

    const res = await POST(req({ text: "X" }), ctx());
    expect(res.status).toBe(201);
    expect((await res.json()).id).toBe("upd1");
  });
});
