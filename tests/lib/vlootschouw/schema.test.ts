import { describe, expect, it } from "vitest";
import { updatePlanningBodySchema } from "@/lib/vlootschouw/schema";

describe("updatePlanningBodySchema", () => {
  it("accepteert een geldig verzoek", () => {
    const result = updatePlanningBodySchema.safeParse({
      padId: "trainer",
      niveau: 2,
      wereld: "Learning",
      nodigNu: 3,
      nodigStraks: 0,
    });
    expect(result.success).toBe(true);
  });

  it("wijst een onbekend pad af", () => {
    expect(
      updatePlanningBodySchema.safeParse({
        padId: "manager",
        niveau: 1,
        wereld: "QA",
        nodigNu: 1,
        nodigStraks: 0,
      }).success,
    ).toBe(false);
  });

  it("wijst een niveau buiten 1-5 af", () => {
    expect(
      updatePlanningBodySchema.safeParse({
        padId: "vakexpert",
        niveau: 6,
        wereld: "QA",
        nodigNu: 1,
        nodigStraks: 0,
      }).success,
    ).toBe(false);
  });

  it("wijst een onbekende wereld af", () => {
    expect(
      updatePlanningBodySchema.safeParse({
        padId: "vakexpert",
        niveau: 1,
        wereld: "Marketing",
        nodigNu: 1,
        nodigStraks: 0,
      }).success,
    ).toBe(false);
  });

  it("wijst negatieve aantallen af", () => {
    expect(
      updatePlanningBodySchema.safeParse({
        padId: "vakexpert",
        niveau: 1,
        wereld: "QA",
        nodigNu: -1,
        nodigStraks: 0,
      }).success,
    ).toBe(false);
  });
});
