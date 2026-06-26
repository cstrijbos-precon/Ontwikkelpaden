import { afterEach, describe, expect, it, vi } from "vitest";
import { checkDatabaseConnection, hasDatabase } from "@/lib/db";

const sqlMock = vi.hoisted(() => vi.fn());

vi.mock("@neondatabase/serverless", () => ({
  neon: () => sqlMock,
}));

describe("hasDatabase", () => {
  const original = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = original;
  });

  it("returns true when DATABASE_URL is set", () => {
    process.env.DATABASE_URL = "postgresql://example";
    expect(hasDatabase()).toBe(true);
  });

  it("returns false when DATABASE_URL is missing", () => {
    process.env.DATABASE_URL = "";
    expect(hasDatabase()).toBe(false);
  });
});

describe("checkDatabaseConnection", () => {
  const original = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = original;
    sqlMock.mockReset();
  });

  it("returns false without DATABASE_URL", async () => {
    process.env.DATABASE_URL = "";
    expect(await checkDatabaseConnection()).toBe(false);
  });

  it("returns true when query succeeds", async () => {
    process.env.DATABASE_URL = "postgresql://example";
    sqlMock.mockResolvedValue([{ ok: 1 }]);
    expect(await checkDatabaseConnection()).toBe(true);
  });

  it("returns false when query fails", async () => {
    process.env.DATABASE_URL = "postgresql://example";
    sqlMock.mockRejectedValue(new Error("connection refused"));
    expect(await checkDatabaseConnection()).toBe(false);
  });
});
