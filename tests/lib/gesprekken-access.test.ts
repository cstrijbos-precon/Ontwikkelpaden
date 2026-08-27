import { describe, expect, it } from "vitest";
import {
  canAccessGesprek,
  wachtendeKoppelingen,
} from "@/lib/gesprekken-access";

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

  it("allows the hoofdbeoordelaar and medebeoordelaar (case-insensitive)", () => {
    const withReviewers = {
      ...gesprek,
      hoofdbeoordelaar: "hoofd@precon.nl",
      medebeoordelaar: "mede@precon.nl",
    };
    expect(canAccessGesprek(withReviewers, "Hoofd@Precon.nl", false)).toBe(
      true,
    );
    expect(canAccessGesprek(withReviewers, "MEDE@precon.nl", false)).toBe(true);
    expect(canAccessGesprek(withReviewers, "stranger@precon.nl", false)).toBe(
      false,
    );
  });

  it("ignores empty reviewer fields", () => {
    const withEmptyReviewers = {
      ...gesprek,
      hoofdbeoordelaar: "",
      medebeoordelaar: "",
    };
    expect(
      canAccessGesprek(withEmptyReviewers, "stranger@precon.nl", false),
    ).toBe(false);
  });

  it("laat een beoordelaar er al in terwijl de koppeling nog wacht", () => {
    // Bewuste keuze: een notulist die net een gesprek aanmaakte, moet er
    // meteen in kunnen. De goedkeuring blijft als bevestiging bestaan.
    expect(
      canAccessGesprek(
        {
          createdBy: "iemand@precon.nl",
          medewerkerEmail: "jan@precon.nl",
          hoofdbeoordelaar: "hoofd@precon.nl",
          hoofdbeoordelaarStatus: "in_afwachting",
        },
        "hoofd@precon.nl",
        false,
      ),
    ).toBe(true);
  });

  it("allows a hoofd-/medebeoordelaar once status toegestaan is", () => {
    const goedgekeurd = {
      ...gesprek,
      hoofdbeoordelaar: "hoofd@precon.nl",
      hoofdbeoordelaarStatus: "toegestaan" as const,
    };
    expect(canAccessGesprek(goedgekeurd, "hoofd@precon.nl", false)).toBe(true);
  });

  it("admins negeren een in_afwachting-status", () => {
    const pending = {
      ...gesprek,
      hoofdbeoordelaar: "hoofd@precon.nl",
      hoofdbeoordelaarStatus: "in_afwachting" as const,
    };
    expect(canAccessGesprek(pending, "admin@precon.nl", true)).toBe(true);
  });
});

describe("wachtendeKoppelingen", () => {
  it("noemt de rollen die nog op akkoord wachten", () => {
    expect(
      wachtendeKoppelingen({
        createdBy: "a@precon.nl",
        medewerkerEmail: "jan@precon.nl",
        hoofdbeoordelaar: "hoofd@precon.nl",
        hoofdbeoordelaarStatus: "in_afwachting",
        medebeoordelaar: "mede@precon.nl",
        medebeoordelaarStatus: "toegestaan",
      }),
    ).toEqual(["hoofdbeoordelaar"]);
  });

  it("is leeg als alles is goedgekeurd", () => {
    expect(
      wachtendeKoppelingen({
        createdBy: "a@precon.nl",
        medewerkerEmail: "jan@precon.nl",
        hoofdbeoordelaar: "hoofd@precon.nl",
        hoofdbeoordelaarStatus: "toegestaan",
      }),
    ).toEqual([]);
  });

  it("telt een leeg rolveld niet mee", () => {
    expect(
      wachtendeKoppelingen({
        createdBy: "a@precon.nl",
        medewerkerEmail: "jan@precon.nl",
        hoofdbeoordelaar: "",
        hoofdbeoordelaarStatus: "in_afwachting",
      }),
    ).toEqual([]);
  });
});
