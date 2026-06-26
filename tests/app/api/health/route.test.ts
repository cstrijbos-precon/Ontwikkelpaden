import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/health/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  hasDatabase: vi.fn(),
  checkDatabaseConnection: vi.fn(),
}));

import { checkDatabaseConnection, hasDatabase } from "@/lib/db";

describe("GET /api/health", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("reports database status", async () => {
    mockAuthUser("u@precon.nl", true);
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(checkDatabaseConnection).mockResolvedValue(true);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.email).toBe("u@precon.nl");
    expect(body.database).toEqual({ configured: true, connected: true });
  });

  it("reports disconnected when db check fails", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    vi.mocked(checkDatabaseConnection).mockResolvedValue(false);

    const res = await GET();
    const body = await res.json();
    expect(body.database).toEqual({ configured: false, connected: false });
  });
});
