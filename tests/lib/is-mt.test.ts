import { afterEach, describe, expect, it } from "vitest";
import { isMtLid } from "@/lib/is-mt";

const origineelMt = process.env.APP_MT;
const origineelAdmins = process.env.APP_ADMINS;

afterEach(() => {
  process.env.APP_MT = origineelMt;
  process.env.APP_ADMINS = origineelAdmins;
});

describe("isMtLid", () => {
  it("sluit iedereen uit zolang de lijst leeg is", () => {
    // Een lege lijst hoort niet "iedereen mag" te betekenen.
    process.env.APP_MT = "";
    process.env.APP_ADMINS = "";
    expect(isMtLid("wie.dan.ook@precongroup.com")).toBe(false);
  });

  it("herkent een MT-lid, ongeacht hoofdletters en spaties", () => {
    process.env.APP_ADMINS = "";
    process.env.APP_MT = " Een@precongroup.com , twee@precongroup.com ";
    expect(isMtLid("een@precongroup.com")).toBe(true);
    expect(isMtLid("TWEE@Precongroup.com")).toBe(true);
  });

  it("laat de rest buiten", () => {
    process.env.APP_ADMINS = "";
    process.env.APP_MT = "een@precongroup.com";
    expect(isMtLid("drie@precongroup.com")).toBe(false);
  });

  it("laat beheerders er altijd in", () => {
    process.env.APP_MT = "";
    process.env.APP_ADMINS = "beheer@precongroup.com";
    expect(isMtLid("beheer@precongroup.com")).toBe(true);
  });

  it("weigert een leeg adres", () => {
    process.env.APP_MT = "een@precongroup.com";
    expect(isMtLid("")).toBe(false);
    expect(isMtLid(null)).toBe(false);
  });
});
