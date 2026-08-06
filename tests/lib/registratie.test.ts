import { afterEach, describe, expect, it } from "vitest";
import {
  domeinIsToegestaan,
  isGeldigEmail,
  registratiecodeKlopt,
  registratiecodeVereist,
  toegestaneDomeinen,
  wachtwoordProbleem,
} from "@/lib/registratie";

const origineleDomeinen = process.env.APP_EMAIL_DOMEINEN;
const origineleCode = process.env.APP_REGISTRATIECODE;

afterEach(() => {
  process.env.APP_EMAIL_DOMEINEN = origineleDomeinen;
  process.env.APP_REGISTRATIECODE = origineleCode;
});

describe("toegestaneDomeinen", () => {
  it("valt terug op de Précon-domeinen", () => {
    process.env.APP_EMAIL_DOMEINEN = "";
    expect(toegestaneDomeinen()).toContain("precongroup.com");
  });

  it("leest een eigen lijst uit de omgeving", () => {
    process.env.APP_EMAIL_DOMEINEN = " Voorbeeld.NL , test.nl ";
    expect(toegestaneDomeinen()).toEqual(["voorbeeld.nl", "test.nl"]);
  });
});

describe("domeinIsToegestaan", () => {
  it("laat een Précon-adres toe, ongeacht hoofdletters", () => {
    process.env.APP_EMAIL_DOMEINEN = "";
    expect(domeinIsToegestaan("Roos@PrecOnGroup.com")).toBe(true);
  });

  it("weigert een adres van buiten", () => {
    process.env.APP_EMAIL_DOMEINEN = "";
    expect(domeinIsToegestaan("iemand@gmail.com")).toBe(false);
  });

  it("weigert een adres zonder domein", () => {
    expect(domeinIsToegestaan("kapot")).toBe(false);
  });

  it("trapt niet in een domein dat er alleen op lijkt", () => {
    process.env.APP_EMAIL_DOMEINEN = "";
    expect(domeinIsToegestaan("iemand@precongroup.com.kwaad.nl")).toBe(false);
  });
});

describe("isGeldigEmail", () => {
  it("herkent geldige en ongeldige adressen", () => {
    expect(isGeldigEmail("roos@precongroup.com")).toBe(true);
    expect(isGeldigEmail("geen-adres")).toBe(false);
    expect(isGeldigEmail("twee@@apenstaartjes.nl")).toBe(false);
  });
});

describe("registratiecode", () => {
  it("is niet vereist zolang de code leeg is", () => {
    process.env.APP_REGISTRATIECODE = "";
    expect(registratiecodeVereist()).toBe(false);
    expect(registratiecodeKlopt(undefined)).toBe(true);
  });

  it("eist een kloppende code zodra die is ingesteld", () => {
    process.env.APP_REGISTRATIECODE = "precon2026";
    expect(registratiecodeVereist()).toBe(true);
    expect(registratiecodeKlopt("precon2026")).toBe(true);
    expect(registratiecodeKlopt(" precon2026 ")).toBe(true);
    expect(registratiecodeKlopt("fout")).toBe(false);
    expect(registratiecodeKlopt(undefined)).toBe(false);
  });
});

describe("wachtwoordProbleem", () => {
  it("wijst te korte wachtwoorden af", () => {
    expect(wachtwoordProbleem("kort1")).toContain("minstens");
  });

  it("eist een letter en een cijfer", () => {
    expect(wachtwoordProbleem("alleenletters")).toContain("cijfer");
    expect(wachtwoordProbleem("1234567890")).toContain("cijfer");
  });

  it("keurt een degelijk wachtwoord goed", () => {
    expect(wachtwoordProbleem("Ontwikkel2026")).toBeNull();
  });
});
