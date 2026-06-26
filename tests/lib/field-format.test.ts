import { describe, expect, it } from "vitest";
import {
  clampPadNiveau,
  clampScore,
  enforceDate,
  enforceDateOrNull,
  formatDateFromDb,
} from "@/lib/field-format";

describe("enforceDate", () => {
  it("accepts valid ISO dates", () => {
    expect(enforceDate("2024-06-15")).toBe("2024-06-15");
  });

  it("returns empty for blank or invalid input", () => {
    expect(enforceDate("")).toBe("");
    expect(enforceDate("  ")).toBe("");
    expect(enforceDate("15-06-2024")).toBe("");
    expect(enforceDate("2024-13-01")).toBe("");
    expect(enforceDate("2024-02-30")).toBe("");
  });

  it("trims whitespace", () => {
    expect(enforceDate("  2024-01-01  ")).toBe("2024-01-01");
  });
});

describe("enforceDateOrNull", () => {
  it("returns null for empty dates", () => {
    expect(enforceDateOrNull("")).toBeNull();
  });

  it("returns date string when valid", () => {
    expect(enforceDateOrNull("2024-03-10")).toBe("2024-03-10");
  });
});

describe("formatDateFromDb", () => {
  it("handles null and invalid values", () => {
    expect(formatDateFromDb(null)).toBeNull();
    expect(formatDateFromDb(undefined)).toBeNull();
    expect(formatDateFromDb(42)).toBeNull();
    expect(formatDateFromDb(new Date("invalid"))).toBeNull();
  });

  it("formats Date objects as YYYY-MM-DD", () => {
    expect(formatDateFromDb(new Date("2024-07-20T12:00:00Z"))).toBe(
      "2024-07-20",
    );
  });

  it("parses string dates", () => {
    expect(formatDateFromDb("2024-05-01")).toBe("2024-05-01");
    expect(formatDateFromDb("bad")).toBeNull();
  });
});

describe("clampScore", () => {
  it("clamps to 0–4 and rounds", () => {
    expect(clampScore(-1)).toBe(0);
    expect(clampScore(2.6)).toBe(3);
    expect(clampScore(10)).toBe(4);
    expect(clampScore(Number.NaN)).toBe(0);
  });
});

describe("clampPadNiveau", () => {
  it("clamps to 0–5 and rounds", () => {
    expect(clampPadNiveau(-2)).toBe(0);
    expect(clampPadNiveau(3.4)).toBe(3);
    expect(clampPadNiveau(99)).toBe(5);
    expect(clampPadNiveau(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
