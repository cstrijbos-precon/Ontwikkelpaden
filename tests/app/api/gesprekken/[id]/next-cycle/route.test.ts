import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/gesprekken/[id]/next-cycle/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  hasDatabase: vi.fn(),
}));

vi.mock("@/lib/gesprekken", () => ({
  GesprekNotCompletedError: class GesprekNotCompletedError extends Error {},
  startNewCycle: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import { GesprekNotCompletedError, startNewCycle } from "@/lib/gesprekken";

const context = { params: Promise.resolve({ id: "gesprek-1" }) };

describe("POST /api/gesprekken/[id]/next-cycle", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    const res = await POST(
      new Request("http://x", { method: "POST" }),
      context,
    );
    expect(res.status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);

    const res = await POST(
      new Request("http://x", { method: "POST" }),
      context,
    );
    expect(res.status).toBe(503);
  });

  it("returns 404 when gesprek not found", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(startNewCycle).mockResolvedValue(null);

    const res = await POST(
      new Request("http://x", { method: "POST" }),
      context,
    );
    expect(res.status).toBe(404);
  });

  it("returns 409 when gesprek is not completed", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(startNewCycle).mockRejectedValue(new GesprekNotCompletedError());

    const res = await POST(
      new Request("http://x", { method: "POST" }),
      context,
    );
    expect(res.status).toBe(409);
  });

  it("returns 201 with the new gesprek on success", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(startNewCycle).mockResolvedValue({ id: "gesprek-2" } as Awaited<
      ReturnType<typeof startNewCycle>
    >);

    const res = await POST(
      new Request("http://x", { method: "POST" }),
      context,
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("gesprek-2");
  });

  it("returns 500 when startNewCycle throws an unexpected error", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(startNewCycle).mockRejectedValue(new Error("db"));

    const res = await POST(
      new Request("http://x", { method: "POST" }),
      context,
    );
    expect(res.status).toBe(500);
  });
});
