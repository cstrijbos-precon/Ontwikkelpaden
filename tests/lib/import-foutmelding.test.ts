import { describe, expect, it } from "vitest";
import { z } from "zod";
import { importFoutmelding } from "@/lib/import-foutmelding";

describe("importFoutmelding", () => {
  it("toont een gewone foutmelding zoals hij is", () => {
    expect(importFoutmelding(new Error("Bestand is te groot"))).toBe(
      "Bestand is te groot",
    );
  });

  it("laat nooit een ruwe zod-lijst aan de gebruiker zien", () => {
    const fout = z.object({ a: z.number() }).safeParse({ a: "x" }).error;
    // Dit is wat een gebruiker eerst te zien kreeg.
    expect(fout?.message).toContain("invalid_type");

    const tekst = importFoutmelding(fout);
    expect(tekst).not.toContain("invalid_type");
    expect(tekst).not.toContain("expected");
    expect(tekst).toMatch(/niet konden verwerken/);
  });

  it("valt terug op een standaardtekst bij iets onbekends", () => {
    expect(importFoutmelding("rare fout")).toBe("Importeren mislukt");
    expect(importFoutmelding(new Error(""))).toBe("Importeren mislukt");
  });
});
