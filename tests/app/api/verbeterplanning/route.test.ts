import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/verbeterplanning/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ hasDatabase: vi.fn() }));
vi.mock("@/lib/verbeterplanning/board", () => ({ getBoard: vi.fn() }));

import { hasDatabase } from "@/lib/db";
import { getBoard } from "@/lib/verbeterplanning/board";

// De Verbeterplanning is MT-only (zie isMtLid); u@precon.nl (de
// standaard testgebruiker) hoort hier standaard bij.
const origineelMt = process.env.APP_MT;
beforeEach(() => {
  process.env.APP_MT = "u@precon.nl";
});
afterEach(() => {
  process.env.APP_MT = origineelMt;
});

describe("GET /api/verbeterplanning", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    expect((await GET()).status).toBe(401);
  });

  it("weigert wie niet in het MT zit", async () => {
    process.env.APP_MT = "iemand.anders@precon.nl";
    mockAuthUser();
    expect((await GET()).status).toBe(403);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    expect((await GET()).status).toBe(503);
  });

  it("returns the board on success", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(getBoard).mockResolvedValue({ projects: [], agenda: [] });

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ projects: [], agenda: [] });
  });

  it("returns 500 when getBoard throws", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(getBoard).mockRejectedValue(new Error("db"));
    expect((await GET()).status).toBe(500);
  });
});
