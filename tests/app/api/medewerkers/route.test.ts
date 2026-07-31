import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/medewerkers/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  hasDatabase: vi.fn(),
}));

vi.mock("@/lib/gesprekken", () => ({
  getBekendeMedewerkers: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import { getBekendeMedewerkers } from "@/lib/gesprekken";

describe("GET /api/medewerkers", () => {
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

  it("returns known medewerkers on success", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(getBekendeMedewerkers).mockResolvedValue([
      { naam: "Jan", email: "jan@precon.nl" },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.medewerkers).toEqual([{ naam: "Jan", email: "jan@precon.nl" }]);
  });

  it("returns 500 when loading fails", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(getBekendeMedewerkers).mockRejectedValue(new Error("db"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
