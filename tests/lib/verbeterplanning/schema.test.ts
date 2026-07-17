import { describe, expect, it } from "vitest";
import {
  createKpiBodySchema,
  createProjectBodySchema,
  setAgendaFieldBodySchema,
  setKpiStatusBodySchema,
  setProjectStatusBodySchema,
} from "@/lib/verbeterplanning/schema";

describe("createProjectBodySchema", () => {
  it("accepts a minimal valid body", () => {
    const result = createProjectBodySchema.safeParse({
      code: "KMO09",
      title: "Titel",
      group: "Impact improvement",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown fields (.strict())", () => {
    const result = createProjectBodySchema.safeParse({
      code: "KMO09",
      title: "Titel",
      group: "Impact improvement",
      extra: "nope",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing code", () => {
    const result = createProjectBodySchema.safeParse({
      title: "Titel",
      group: "Impact improvement",
    });
    expect(result.success).toBe(false);
  });
});

describe("setProjectStatusBodySchema", () => {
  it("accepts a valid month index and status", () => {
    expect(
      setProjectStatusBodySchema.safeParse({ monthIndex: 0, status: "green" })
        .success,
    ).toBe(true);
    expect(
      setProjectStatusBodySchema.safeParse({ monthIndex: 32, status: "" })
        .success,
    ).toBe(true);
  });

  it("rejects an out-of-range month index", () => {
    expect(
      setProjectStatusBodySchema.safeParse({ monthIndex: 33, status: "green" })
        .success,
    ).toBe(false);
    expect(
      setProjectStatusBodySchema.safeParse({ monthIndex: -1, status: "green" })
        .success,
    ).toBe(false);
  });

  it("rejects an invalid status value", () => {
    expect(
      setProjectStatusBodySchema.safeParse({ monthIndex: 0, status: "blue" })
        .success,
    ).toBe(false);
  });
});

describe("setKpiStatusBodySchema", () => {
  it("rejects 'purple' (only allowed for project/milestone status)", () => {
    expect(
      setKpiStatusBodySchema.safeParse({ quarterIndex: 0, status: "purple" })
        .success,
    ).toBe(false);
  });

  it("accepts the 4 valid kpi statuses", () => {
    for (const status of ["", "green", "amber", "red"]) {
      expect(
        setKpiStatusBodySchema.safeParse({ quarterIndex: 0, status }).success,
      ).toBe(true);
    }
  });

  it("rejects an out-of-range quarter index", () => {
    expect(
      setKpiStatusBodySchema.safeParse({ quarterIndex: 8, status: "green" })
        .success,
    ).toBe(false);
  });
});

describe("createKpiBodySchema", () => {
  it("requires a valid type", () => {
    expect(createKpiBodySchema.safeParse({ type: "resultaat" }).success).toBe(
      true,
    );
    expect(createKpiBodySchema.safeParse({ type: "onbekend" }).success).toBe(
      false,
    );
  });
});

describe("setAgendaFieldBodySchema", () => {
  it("requires at least one field", () => {
    expect(setAgendaFieldBodySchema.safeParse({}).success).toBe(false);
  });

  it("accepts a single field", () => {
    expect(
      setAgendaFieldBodySchema.safeParse({ datum: "1 juni" }).success,
    ).toBe(true);
  });
});
