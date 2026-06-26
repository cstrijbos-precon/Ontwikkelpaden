import { afterEach, describe, expect, it } from "vitest";
import { isAdmin } from "@/lib/is-admin";

describe("isAdmin", () => {
  const original = process.env.APP_ADMINS;

  afterEach(() => {
    process.env.APP_ADMINS = original;
  });

  it("returns false when APP_ADMINS is empty", () => {
    process.env.APP_ADMINS = "";
    expect(isAdmin("admin@precon.nl")).toBe(false);
  });

  it("matches admins case-insensitively", () => {
    process.env.APP_ADMINS = "Admin@Precon.nl, other@precon.nl";
    expect(isAdmin("admin@precon.nl")).toBe(true);
    expect(isAdmin("other@precon.nl")).toBe(true);
    expect(isAdmin("user@precon.nl")).toBe(false);
  });

  it("returns false for missing email", () => {
    process.env.APP_ADMINS = "admin@precon.nl";
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});
