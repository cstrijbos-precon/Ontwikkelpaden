import { beforeEach, describe, expect, it, vi } from "vitest";
import { upsertPlanningCel } from "@/lib/vlootschouw/planning";

const sqlMock = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
}));

describe("upsertPlanningCel", () => {
  beforeEach(() => {
    sqlMock.mockReset();
  });

  it("voert een INSERT ... ON CONFLICT uit met de juiste waarden", async () => {
    sqlMock.mockResolvedValue([]);

    await upsertPlanningCel("mt-lid@precon.nl", {
      padId: "adviseur",
      niveau: 3,
      wereld: "RA",
      nodigNu: 4,
      nodigStraks: 2,
    });

    expect(sqlMock).toHaveBeenCalledTimes(1);
    const call = sqlMock.mock.calls[0] as unknown[];
    const text = (call[0] as TemplateStringsArray).join("");
    expect(text).toContain("INSERT INTO vlootschouw_planning");
    expect(text).toContain("ON CONFLICT");
    expect(call).toContain("adviseur");
    expect(call).toContain("RA");
    expect(call).toContain("mt-lid@precon.nl");
  });
});
