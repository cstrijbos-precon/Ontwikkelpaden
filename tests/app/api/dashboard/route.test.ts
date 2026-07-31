import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/dashboard/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  hasDatabase: vi.fn(),
}));

vi.mock("@/lib/gesprekken", () => ({
  getDashboardOverzicht: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import { getDashboardOverzicht } from "@/lib/gesprekken";

describe("GET /api/dashboard", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);

    const res = await GET();
    expect(res.status).toBe(503);
  });

  it("returns the overview on success", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(getDashboardOverzicht).mockResolvedValue({
      eigen: [],
      alsHoofdbeoordelaar: [],
      alsMedebeoordelaar: [],
      pendingGoedkeuringen: [],
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.eigen).toEqual([]);
  });

  it("returns 500 when loading fails", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(getDashboardOverzicht).mockRejectedValue(new Error("db"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
