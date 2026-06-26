import { describe, expect, it } from "vitest";
import { createInitialState, mergeWithInitialState } from "@/lib/initial-state";

describe("createInitialState", () => {
  it("returns empty defaults with three situaties", () => {
    const state = createInitialState();
    expect(state.naam).toBe("");
    expect(state.situaties).toEqual(["", "", ""]);
    expect(state.scores.t).toBe(0);
    expect(state.ambities.trainer).toBe(false);
  });
});

describe("mergeWithInitialState", () => {
  it("merges partial input and validates", () => {
    const merged = mergeWithInitialState({
      naam: "Jan",
      scores: { b: 2, k: 0, o: 0, org: 0, t: 0 },
    });
    expect(merged.naam).toBe("Jan");
    expect(merged.scores.b).toBe(2);
    expect(merged.scores.k).toBe(0);
  });

  it("returns defaults for non-object input", () => {
    const merged = mergeWithInitialState(null);
    expect(merged).toEqual(createInitialState());
  });

  it("ignores unknown keys", () => {
    const merged = mergeWithInitialState({ naam: "Piet", unknown: "x" });
    expect(merged.naam).toBe("Piet");
    expect("unknown" in merged).toBe(false);
  });
});
