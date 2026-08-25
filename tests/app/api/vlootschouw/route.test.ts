import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/vlootschouw/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  hasDatabase: vi.fn(),
}));

vi.mock("@/lib/vlootschouw/overzicht", () => ({
  getVlootschouwOverzicht: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import { getVlootschouwOverzicht } from "@/lib/vlootschouw/overzicht";

// De Vlootschouw is afgeschermd voor het MT; de testgebruikers horen erbij.
const origineelMt = process.env.APP_MT;
beforeEach(() => {
  process.env.APP_MT = "u@precon.nl,mt@precon.nl";
});
afterEach(() => {
  process.env.APP_MT = origineelMt;
});

describe("GET /api/vlootschouw", () => {
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

  it("returns the overzicht on success", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(getVlootschouwOverzicht).mockResolvedValue({
      paden: [],
      rollen: [],
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paden).toEqual([]);
  });

  it("returns 500 when loading fails", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(getVlootschouwOverzicht).mockRejectedValue(new Error("db"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
  it("weigert wie niet in het MT zit", async () => {
    process.env.APP_MT = "iemand.anders@precon.nl";
    mockAuthUser();
    // Eerdere tests in dit bestand hebben de mock al aangeroepen.
    vi.mocked(getVlootschouwOverzicht).mockClear();

    const res = await GET();
    expect(res.status).toBe(403);
    expect(vi.mocked(getVlootschouwOverzicht)).not.toHaveBeenCalled();
  });
});
