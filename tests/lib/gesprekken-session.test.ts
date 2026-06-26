import { afterEach, describe, expect, it } from "vitest";
import {
  getStoredGesprekId,
  setStoredGesprekId,
} from "@/lib/gesprekken-session";

describe("gesprekken-session", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("stores and retrieves gesprek id", () => {
    setStoredGesprekId("abc-123");
    expect(getStoredGesprekId()).toBe("abc-123");
  });

  it("returns null when nothing stored", () => {
    expect(getStoredGesprekId()).toBeNull();
  });
});
