import { describe, expect, it } from "vitest";
import {
  AGENDA_MONTHS,
  KPI_QUARTERS,
  MONTHS,
  nextKpiStatus,
  nextProjectStatus,
} from "@/lib/verbeterplanning/constants";

describe("verbeterplanning constants", () => {
  it("has fixed array lengths", () => {
    expect(MONTHS).toHaveLength(33);
    expect(KPI_QUARTERS).toHaveLength(8);
    expect(AGENDA_MONTHS).toHaveLength(18);
  });

  it("nextProjectStatus cycles through 5 states", () => {
    expect(nextProjectStatus("")).toBe("green");
    expect(nextProjectStatus("green")).toBe("amber");
    expect(nextProjectStatus("amber")).toBe("red");
    expect(nextProjectStatus("red")).toBe("purple");
    expect(nextProjectStatus("purple")).toBe("");
  });

  it("nextKpiStatus cycles through 4 states (no purple)", () => {
    expect(nextKpiStatus("")).toBe("green");
    expect(nextKpiStatus("green")).toBe("amber");
    expect(nextKpiStatus("amber")).toBe("red");
    expect(nextKpiStatus("red")).toBe("");
  });

  it("falls back to '' for an unrecognized status value", () => {
    // @ts-expect-error -- exercising the defensive fallback for a value outside the known cycle
    expect(nextProjectStatus("onbekend")).toBe("");
    // @ts-expect-error -- exercising the defensive fallback for a value outside the known cycle
    expect(nextKpiStatus("onbekend")).toBe("");
  });
});
