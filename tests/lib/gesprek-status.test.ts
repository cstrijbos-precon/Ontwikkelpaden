import { describe, expect, it } from "vitest";
import { statusWeergave } from "@/lib/gesprek-status";

describe("statusWeergave", () => {
  it("noemt een concept zonder handtekeningen een concept", () => {
    expect(statusWeergave("draft", 0)).toEqual({
      label: "Concept",
      soort: "concept",
    });
  });

  it("toont een concept met handtekeningen als wachtend op de rest", () => {
    expect(statusWeergave("draft", 1)).toEqual({
      label: "Wacht op ondertekening (1 van 3)",
      soort: "ondertekenen",
    });
    expect(statusWeergave("draft", 2).label).toBe(
      "Wacht op ondertekening (2 van 3)",
    );
  });

  it("noemt een gesprek met alle handtekeningen afgerond", () => {
    expect(statusWeergave("completed", 3)).toEqual({
      label: "Afgerond",
      soort: "klaar",
    });
  });

  it("laat de handtekeningen buiten beschouwing bij een afgerond of gearchiveerd gesprek", () => {
    expect(statusWeergave("completed", 0).label).toBe("Afgerond");
    expect(statusWeergave("archived", 2).label).toBe("Gearchiveerd");
  });
});
