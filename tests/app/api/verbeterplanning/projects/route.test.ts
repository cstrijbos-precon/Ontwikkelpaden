import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/verbeterplanning/projects/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ hasDatabase: vi.fn() }));
vi.mock("@/lib/verbeterplanning/projects", () => ({ createProject: vi.fn() }));

import { hasDatabase } from "@/lib/db";
import { ProjectCodeExistsError } from "@/lib/verbeterplanning/errors";
import { createProject } from "@/lib/verbeterplanning/projects";

function req(body: unknown) {
  return new Request("http://x", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/verbeterplanning/projects", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    expect((await POST(req({}))).status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    expect((await POST(req({}))).status).toBe(503);
  });

  it("returns 400 for invalid JSON", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    const res = await POST(
      new Request("http://x", { method: "POST", body: "not-json{" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for validation failure", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    expect((await POST(req({ code: "" }))).status).toBe(400);
  });

  it("returns 409 for a duplicate project code", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(createProject).mockRejectedValue(
      new ProjectCodeExistsError("KMO01"),
    );

    const res = await POST(
      req({ code: "KMO01", title: "Titel", group: "Impact improvement" }),
    );
    expect(res.status).toBe(409);
  });

  it("creates a project on a valid body", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(createProject).mockResolvedValue({
      code: "KMO09",
      title: "Titel",
      mtlid: "",
      trekker: "",
      team: "",
      rg: "",
      kpi: "",
      group: "Impact improvement",
    });

    const res = await POST(
      req({ code: "KMO09", title: "Titel", group: "Impact improvement" }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).code).toBe("KMO09");
  });
});
