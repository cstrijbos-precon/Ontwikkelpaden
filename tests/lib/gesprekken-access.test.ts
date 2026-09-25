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

  it("allows the hoofdbeoordelaar and medebeoordelaar (case-insensitive), eenmaal toegestaan", () => {
    const withReviewers = {
      ...gesprek,
      hoofdbeoordelaar: "hoofd@precon.nl",
      hoofdbeoordelaarStatus: "toegestaan" as const,
      medebeoordelaar: "mede@precon.nl",
      medebeoordelaarStatus: "toegestaan" as const,
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

  it("weigert een hoofd-/medebeoordelaar zolang de koppeling nog wacht op goedkeuring", () => {
    // Voorheen kreeg iedereen die zichzelf koppelde meteen volledige
    // lees-/schrijftoegang, nog vóór de medewerker iets had goedgekeurd — dat
    // was voor HR-gegevens een privacyprobleem, geen features. De aanmaker
    // van het gesprek (created_by) blijft wel altijd toegang houden; dat is
    // een apart pad, getest hierboven en hieronder.
    expect(
      canAccessGesprek(
        {
          createdBy: "iemand-anders@precon.nl",
          medewerkerEmail: "jan@precon.nl",
          hoofdbeoordelaar: "hoofd@precon.nl",
          hoofdbeoordelaarStatus: "in_afwachting",
        },
        "hoofd@precon.nl",
        false,
      ),
    ).toBe(false);
  });

  it("laat de aanmaker van een gesprek er wél meteen in, ook als die zichzelf als beoordelaar nog moet laten goedkeuren", () => {
    // Dit dekt de notulist die het gesprek net heeft aangemaakt: die staat
    // niet voor een dichte deur, via created_by — niet via de nog hangende
    // beoordelaarskoppeling.
    expect(
      canAccessGesprek(
        {
          createdBy: "hoofd@precon.nl",
          medewerkerEmail: "jan@precon.nl",
          hoofdbeoordelaar: "hoofd@precon.nl",
          hoofdbeoordelaarStatus: "in_afwachting",
        },
        "hoofd@precon.nl",
        false,
      ),
    ).toBe(true);
  });

  it("trekt de toegang van de aanmaker in zodra de medewerker die persoon expliciet heeft afgewezen", () => {
    expect(
      canAccessGesprek(
        {
          createdBy: "hoofd@precon.nl",
          medewerkerEmail: "jan@precon.nl",
          toegangGeweigerdVoor: ["hoofd@precon.nl"],
        },
        "Hoofd@Precon.nl",
        false,
      ),
    ).toBe(false);
  });

  it("laat andere toegang met rust als iemand anders is afgewezen", () => {
    expect(
      canAccessGesprek(
        {
          createdBy: "hoofd@precon.nl",
          medewerkerEmail: "jan@precon.nl",
          toegangGeweigerdVoor: ["iemand-anders@precon.nl"],
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
