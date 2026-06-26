import { describe, expect, it, vi } from "vitest";
import { GET, PUT } from "@/app/api/gesprekken/[id]/route";
import { createInitialState } from "@/lib/initial-state";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  hasDatabase: vi.fn(),
}));

vi.mock("@/lib/gesprekken", () => ({
  getGesprekById: vi.fn(),
  updateGesprek: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import { getGesprekById, updateGesprek } from "@/lib/gesprekken";

const context = { params: Promise.resolve({ id: "gesprek-1" }) };

describe("GET /api/gesprekken/[id]", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    const res = await GET(new Request("http://x"), context);
    expect(res.status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);

    const res = await GET(new Request("http://x"), context);
    expect(res.status).toBe(503);
  });

  it("returns 404 when not found", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(getGesprekById).mockResolvedValue(null);

    const res = await GET(new Request("http://x"), context);
    expect(res.status).toBe(404);
  });

  it("returns gesprek when found", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(getGesprekById).mockResolvedValue({ id: "gesprek-1" } as Awaited<
      ReturnType<typeof getGesprekById>
    >);

    const res = await GET(new Request("http://x"), context);
    expect(res.status).toBe(200);
  });

  it("returns 500 when get throws", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(getGesprekById).mockRejectedValue(new Error("db"));

    const res = await GET(new Request("http://x"), context);
    expect(res.status).toBe(500);
  });
});

describe("PUT /api/gesprekken/[id]", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    const res = await PUT(
      new Request("http://x", { method: "PUT", body: "{}" }),
      context,
    );
    expect(res.status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);

    const res = await PUT(
      new Request("http://x", { method: "PUT", body: "{}" }),
      context,
    );
    expect(res.status).toBe(503);
  });

  it("returns 400 for validation failure", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);

    const res = await PUT(
      new Request("http://x", {
        method: "PUT",
        body: JSON.stringify({ unknown: true }),
      }),
      context,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);

    const res = await PUT(
      new Request("http://x", { method: "PUT", body: "{" }),
      context,
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when update finds nothing", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(updateGesprek).mockResolvedValue(null);

    const res = await PUT(
      new Request("http://x", {
        method: "PUT",
        body: JSON.stringify({ state: createInitialState() }),
      }),
      context,
    );
    expect(res.status).toBe(404);
  });

  it("updates gesprek on success", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(updateGesprek).mockResolvedValue({ id: "gesprek-1" } as Awaited<
      ReturnType<typeof updateGesprek>
    >);

    const res = await PUT(
      new Request("http://x", {
        method: "PUT",
        body: JSON.stringify({ state: createInitialState() }),
      }),
      context,
    );
    expect(res.status).toBe(200);
  });

  it("returns 500 when update throws", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(updateGesprek).mockRejectedValue(new Error("db"));

    const res = await PUT(
      new Request("http://x", {
        method: "PUT",
        body: JSON.stringify({ state: createInitialState() }),
      }),
      context,
    );
    expect(res.status).toBe(500);
  });
});
