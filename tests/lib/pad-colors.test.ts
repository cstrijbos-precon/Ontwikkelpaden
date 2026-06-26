import { describe, expect, it } from "vitest";
import { getPadColor } from "@/lib/pad-colors";

describe("getPadColor", () => {
  it("returns CSS variable per pad", () => {
    expect(getPadColor("vakexpert")).toBe("var(--pad-vakexpert)");
    expect(getPadColor("trainer")).toBe("var(--pad-trainer)");
  });
});
