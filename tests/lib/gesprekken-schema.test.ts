import { describe, expect, it } from "vitest";
import {
  createGesprekBodySchema,
  ontwikkelpadenStateSchema,
  updateGesprekBodySchema,
} from "@/lib/gesprekken-schema";
import { createInitialState } from "@/lib/initial-state";

describe("ontwikkelpadenStateSchema", () => {
  it("accepts a valid initial state", () => {
    const result = ontwikkelpadenStateSchema.safeParse(createInitialState());
    expect(result.success).toBe(true);
  });

  it("normalizes invalid dates to empty string", () => {
    const state = { ...createInitialState(), datum: "not-a-date" };
    const result = ontwikkelpadenStateSchema.parse(state);
    expect(result.datum).toBe("");
  });

  it("coerces score strings to integers within range", () => {
    const state = {
      ...createInitialState(),
      scores: { b: "3", k: "0", o: "4", org: "2", t: "1" },
    };
    const result = ontwikkelpadenStateSchema.parse(state);
    expect(result.scores.b).toBe(3);
  });

  it("accepts reflecties with a valid datum and normalizes invalid ones", () => {
    const state = {
      ...createInitialState(),
      reflecties: [
        { id: "r1", datum: "2026-03-01", tekst: "Goed gesprek gehad" },
        { id: "r2", datum: "not-a-date", tekst: "" },
      ],
    };
    const result = ontwikkelpadenStateSchema.parse(state);
    expect(result.reflecties).toHaveLength(2);
    expect(result.reflecties[0]?.datum).toBe("2026-03-01");
    expect(result.reflecties[1]?.datum).toBe("");
  });

  it("validates akkoord flags and niveauInschaling", () => {
    const state = {
      ...createInitialState(),
      niveauInschaling: "Medior",
      akkoordProfessional: true,
      akkoordHoofdbeoordelaar: true,
      akkoordMedebeoordelaar: false,
    };
    const result = ontwikkelpadenStateSchema.parse(state);
    expect(result.niveauInschaling).toBe("Medior");
    expect(result.akkoordProfessional).toBe(true);
    expect(result.akkoordMedebeoordelaar).toBe(false);
  });
});

describe("createGesprekBodySchema", () => {
  it("accepts empty body", () => {
    expect(createGesprekBodySchema.safeParse({}).success).toBe(true);
  });

  it("rejects unknown fields", () => {
    expect(createGesprekBodySchema.safeParse({ extra: true }).success).toBe(
      false,
    );
  });

  it("validates optional medewerker email", () => {
    expect(
      createGesprekBodySchema.safeParse({ medewerkerEmail: "a@b.nl" }).success,
    ).toBe(true);
    expect(
      createGesprekBodySchema.safeParse({ medewerkerEmail: "invalid" }).success,
    ).toBe(false);
  });
});

describe("updateGesprekBodySchema", () => {
  it("requires state", () => {
    expect(updateGesprekBodySchema.safeParse({}).success).toBe(false);
    expect(
      updateGesprekBodySchema.safeParse({ state: createInitialState() })
        .success,
    ).toBe(true);
  });

  it("accepts optional status and medewerkerEmail", () => {
    const parsed = updateGesprekBodySchema.safeParse({
      state: createInitialState(),
      status: "completed",
      medewerkerEmail: null,
    });
    expect(parsed.success).toBe(true);
  });
});
