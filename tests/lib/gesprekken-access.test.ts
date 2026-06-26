import { describe, expect, it } from "vitest";
import { canAccessGesprek } from "@/lib/gesprekken-access";

const gesprek = {
  createdBy: "creator@precon.nl",
  medewerkerEmail: "medewerker@precon.nl",
};

describe("canAccessGesprek", () => {
  it("allows admins", () => {
    expect(canAccessGesprek(gesprek, "other@precon.nl", true)).toBe(true);
  });

  it("allows creator and medewerker (case-insensitive)", () => {
    expect(canAccessGesprek(gesprek, "Creator@Precon.nl", false)).toBe(true);
    expect(canAccessGesprek(gesprek, "MEDEWERKER@precon.nl", false)).toBe(true);
  });

  it("denies unrelated users", () => {
    expect(canAccessGesprek(gesprek, "stranger@precon.nl", false)).toBe(false);
  });

  it("denies when medewerker email is null and user is not creator", () => {
    expect(
      canAccessGesprek(
        { createdBy: "creator@precon.nl", medewerkerEmail: null },
        "other@precon.nl",
        false,
      ),
    ).toBe(false);
  });
});
