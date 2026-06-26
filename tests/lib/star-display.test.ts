import { describe, expect, it } from "vitest";
import { sterDisplay, sterSym } from "@/lib/star-display";

describe("sterSym", () => {
  it("shows dash for zero or negative", () => {
    expect(sterSym(0)).toBe("—");
    expect(sterSym(-1)).toBe("—");
  });

  it("renders filled and empty stars", () => {
    expect(sterSym(2)).toBe("★★☆☆");
    expect(sterSym(4)).toBe("★★★★");
  });
});

describe("sterDisplay", () => {
  it("returns all empty stars for zero score", () => {
    expect(sterDisplay(0)).toEqual({ filled: "", empty: "★★★★" });
  });

  it("splits filled and empty portions", () => {
    expect(sterDisplay(3)).toEqual({ filled: "★★★", empty: "★" });
  });
});
