import { describe, expect, it, vi } from "vitest";
import { PUT } from "@/app/api/vlootschouw/planning/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  hasDatabase: vi.fn(),
}));

vi.mock("@/lib/vlootschouw/planning", () => ({
  upsertPlanningCel: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import { upsertPlanningCel } from "@/lib/vlootschouw/planning";

function request(body: unknown) {
  return new Request("http://x", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

const geldigVerzoek = {
  padId: "vakexpert",
  niveau: 1,
  wereld: "QA",
  nodigNu: 2,
  nodigStraks: 0,
};

describe("PUT /api/vlootschouw/planning", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    const res = await PUT(request(geldigVerzoek));
    expect(res.status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    const res = await PUT(request(geldigVerzoek));
    expect(res.status).toBe(503);
  });

  it("returns 400 for invalid JSON", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    const res = await PUT(
      new Request("http://x", { method: "PUT", body: "not-json{" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for validation failure", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    const res = await PUT(request({ padId: "onbekend" }));
    expect(res.status).toBe(400);
  });

  it("returns ok on success", async () => {
    mockAuthUser("mt@precon.nl");
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(upsertPlanningCel).mockResolvedValue(undefined);

    const res = await PUT(request(geldigVerzoek));
    expect(res.status).toBe(200);
    expect(upsertPlanningCel).toHaveBeenCalledWith(
      "mt@precon.nl",
      geldigVerzoek,
    );
  });

  it("returns 500 on unexpected error", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(upsertPlanningCel).mockRejectedValue(new Error("db"));

    const res = await PUT(request(geldigVerzoek));
    expect(res.status).toBe(500);
  });
});
