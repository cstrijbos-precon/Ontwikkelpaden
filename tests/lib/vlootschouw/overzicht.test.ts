import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  classificeerPad,
  getVlootschouwOverzicht,
} from "@/lib/vlootschouw/overzicht";

const sqlMock = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
}));

describe("classificeerPad", () => {
  it("key-players: aanwezig + nu nodig + straks nodig", () => {
    expect(classificeerPad(3, 2, 1)).toBe("key-players");
  });

  it("wachtkamer: aanwezig + straks nodig, niet nu nodig", () => {
    expect(classificeerPad(3, 0, 1)).toBe("wachtkamer");
  });

  it("zorgenkindjes: alleen aanwezig", () => {
    expect(classificeerPad(3, 0, 0)).toBe("zorgenkindjes");
  });

  it("huidige-kern: aanwezig + nu nodig, niet straks", () => {
    expect(classificeerPad(3, 2, 0)).toBe("huidige-kern");
  });

  it("tijdelijke-krachten: alleen nu nodig", () => {
    expect(classificeerPad(0, 2, 0)).toBe("tijdelijke-krachten");
  });

  it("most-wanted: nu nodig + straks nodig, niet aanwezig", () => {
    expect(classificeerPad(0, 2, 1)).toBe("most-wanted");
  });

  it("toekomstig-talent: alleen straks nodig", () => {
    expect(classificeerPad(0, 0, 1)).toBe("toekomstig-talent");
  });

  it("geen-data: niets bekend", () => {
    expect(classificeerPad(0, 0, 0)).toBe("geen-data");
  });
});

describe("getVlootschouwOverzicht", () => {
  beforeEach(() => {
    sqlMock.mockReset();
  });

  it("combineert aanwezig- en planning-data tot pad- en rol-overzichten", async () => {
    sqlMock
      .mockResolvedValueOnce([
        { pad_id: "vakexpert", wereld: "QA", huidig_niveau: 2, aantal: 3 },
      ])
      .mockResolvedValueOnce([
        {
          pad_id: "vakexpert",
          niveau: 2,
          wereld: "QA",
          nodig_nu: 2,
          nodig_straks: 1,
        },
      ]);

    const overzicht = await getVlootschouwOverzicht();

    const vakexpertRij = overzicht.rollen.find(
      (r) => r.padId === "vakexpert" && r.niveau === 2 && r.wereld === "QA",
    );
    expect(vakexpertRij).toMatchObject({
      aanwezig: 3,
      nodigNu: 2,
      nodigStraks: 1,
      rolNaam: "Deskundige",
    });

    const vakexpertPad = overzicht.paden.find((p) => p.padId === "vakexpert");
    expect(vakexpertPad?.aanwezig).toBe(3);
    expect(vakexpertPad?.nodigNu).toBe(2);
    expect(vakexpertPad?.nodigStraks).toBe(1);
    expect(vakexpertPad?.vennCategorie).toBe("key-players");

    // alle (pad, niveau, wereld)-combinaties bestaan, ook zonder data
    expect(overzicht.rollen).toHaveLength(4 * 5 * 5);
  });

  it("geeft geen-data terug voor paden zonder enige informatie", async () => {
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const overzicht = await getVlootschouwOverzicht();
    expect(overzicht.paden.every((p) => p.vennCategorie === "geen-data")).toBe(
      true,
    );
  });
});
