import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/gesprekken/[id]/beoordelaar-status/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  hasDatabase: vi.fn(),
}));

vi.mock("@/lib/gesprekken", () => ({
  GeenToegangError: class GeenToegangError extends Error {},
  respondBeoordelaarKoppeling: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import {
  GeenToegangError,
  respondBeoordelaarKoppeling,
} from "@/lib/gesprekken";

const context = { params: Promise.resolve({ id: "gesprek-1" }) };

function request(body: unknown) {
  return new Request("http://x", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/gesprekken/[id]/beoordelaar-status", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    const res = await POST(request({}), context);
    expect(res.status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);
    const res = await POST(request({}), context);
    expect(res.status).toBe(503);
  });

  it("returns 400 for validation failure", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    const res = await POST(
      request({ rol: "hoofdbeoordelaar", actie: "onbekend" }),
      context,
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when gesprek not found", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(respondBeoordelaarKoppeling).mockResolvedValue(null);

    const res = await POST(
      request({ rol: "hoofdbeoordelaar", actie: "goedkeuren" }),
      context,
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when the user has no toegang", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(respondBeoordelaarKoppeling).mockRejectedValue(
      new GeenToegangError(),
    );

    const res = await POST(
      request({ rol: "hoofdbeoordelaar", actie: "goedkeuren" }),
      context,
    );
    expect(res.status).toBe(403);
  });

  it("returns the updated gesprek on success", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(respondBeoordelaarKoppeling).mockResolvedValue({
      id: "gesprek-1",
    } as Awaited<ReturnType<typeof respondBeoordelaarKoppeling>>);

    const res = await POST(
      request({ rol: "hoofdbeoordelaar", actie: "goedkeuren" }),
      context,
    );
    expect(res.status).toBe(200);
  });

  it("returns 500 on unexpected error", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(respondBeoordelaarKoppeling).mockRejectedValue(new Error("db"));

    const res = await POST(
      request({ rol: "hoofdbeoordelaar", actie: "goedkeuren" }),
      context,
    );
    expect(res.status).toBe(500);
  });
});
