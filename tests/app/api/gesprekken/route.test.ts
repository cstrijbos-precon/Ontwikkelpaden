import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/gesprekken/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  hasDatabase: vi.fn(),
}));

vi.mock("@/lib/gesprekken", () => ({
  listGesprekken: vi.fn(),
  createGesprek: vi.fn(),
}));

import { hasDatabase } from "@/lib/db";
import { createGesprek, listGesprekken } from "@/lib/gesprekken";

describe("GET /api/gesprekken", () => {
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

  it("returns items on success", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(listGesprekken).mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [] });
  });

  it("returns 500 when list fails", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(listGesprekken).mockRejectedValue(new Error("db"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe("POST /api/gesprekken", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    const res = await POST(new Request("http://x", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("returns 503 without database", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(false);

    const res = await POST(new Request("http://x", { method: "POST" }));
    expect(res.status).toBe(503);
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

    const res = await POST(
      new Request("http://x", {
        method: "POST",
        body: JSON.stringify({ unknown: true }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("creates gesprek on valid body", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(createGesprek).mockResolvedValue({ id: "new" } as Awaited<
      ReturnType<typeof createGesprek>
    >);

    const res = await POST(
      new Request("http://x", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "new" });
  });

  it("returns 500 when create fails", async () => {
    mockAuthUser();
    vi.mocked(hasDatabase).mockReturnValue(true);
    vi.mocked(createGesprek).mockRejectedValue(new Error("db"));

    const res = await POST(
      new Request("http://x", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(500);
  });
});
