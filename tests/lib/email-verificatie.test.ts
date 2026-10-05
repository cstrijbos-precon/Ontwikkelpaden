import { beforeEach, describe, expect, it, vi } from "vitest";
import { maakVerificatieToken, verzilverToken } from "@/lib/email-verificatie";

const sqlMock = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
  hasDatabase: () => true,
}));

function queryVan(call: unknown[]): string {
  return (call[0] as TemplateStringsArray).join(" ");
}

beforeEach(() => {
  sqlMock.mockReset().mockResolvedValue([]);
});

describe("maakVerificatieToken", () => {
  it("bewaart alleen een hash, nooit het token zelf", async () => {
    const token = await maakVerificatieToken("roos@precongroup.com");

    const insert = sqlMock.mock.calls.find((c) =>
      queryVan(c).includes("INSERT INTO email_verificaties"),
    );
    expect(insert).toBeDefined();
    expect(insert).not.toContain(token);

    // Een sha256-hash is 64 hextekens.
    const hash = insert?.[1] as string;
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("trekt eerdere openstaande links voor hetzelfde adres in", async () => {
    await maakVerificatieToken("roos@precongroup.com");

    const verwijder = sqlMock.mock.calls.find((c) =>
      queryVan(c).includes("DELETE FROM email_verificaties"),
    );
    expect(verwijder).toContain("roos@precongroup.com");
  });

  it("geeft elke keer een ander token", async () => {
    const a = await maakVerificatieToken("roos@precongroup.com");
    const b = await maakVerificatieToken("roos@precongroup.com");
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });
});

describe("verzilverToken", () => {
  const morgen = new Date(Date.now() + 3_600_000).toISOString();
  const gisteren = new Date(Date.now() - 3_600_000).toISOString();

  it("bevestigt het account bij een geldig token, in één statement", async () => {
    sqlMock.mockResolvedValueOnce([{ email: "roos@precongroup.com" }]);

    const resultaat = await verzilverToken("geldig-token");
    expect(resultaat).toEqual({ gelukt: true, email: "roos@precongroup.com" });

    // Token markeren én account bevestigen horen in dezelfde query, anders is
    // het niet atomair.
    expect(sqlMock).toHaveBeenCalledTimes(1);
    const query = queryVan(sqlMock.mock.calls[0] as unknown[]);
    expect(query).toContain("UPDATE email_verificaties SET gebruikt_op");
    expect(query).toContain("UPDATE app_users SET geverifieerd_op");
    expect(sqlMock.mock.calls[0]?.[1]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("weigert een onbekend token", async () => {
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    expect(await verzilverToken("nep")).toEqual({
      gelukt: false,
      reden: "onbekend",
    });
  });

  it("weigert een verlopen token", async () => {
    sqlMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ verloopt_op: gisteren, gebruikt_op: null }]);

    expect(await verzilverToken("oud")).toEqual({
      gelukt: false,
      reden: "verlopen",
    });
  });

  it("laat een token maar één keer werken", async () => {
    sqlMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { verloopt_op: morgen, gebruikt_op: new Date().toISOString() },
      ]);

    expect(await verzilverToken("alweer")).toEqual({
      gelukt: false,
      reden: "gebruikt",
    });
  });

  it("laat bij twee gelijktijdige klikken er maar één slagen", async () => {
    // De database laat de WHERE-voorwaarde maar voor één van de twee kloppen.
    sqlMock
      .mockResolvedValueOnce([{ email: "roos@precongroup.com" }]) // klik 1
      .mockResolvedValueOnce([]) // klik 2: update pakt niets meer
      .mockResolvedValueOnce([
        { verloopt_op: morgen, gebruikt_op: new Date().toISOString() },
      ]);

    const [een, twee] = await Promise.all([
      verzilverToken("dubbel"),
      verzilverToken("dubbel"),
    ]);

    expect([een.gelukt, twee.gelukt].filter(Boolean)).toHaveLength(1);
    expect([een, twee]).toContainEqual({ gelukt: false, reden: "gebruikt" });
  });

  it("meldt 'gebruikt' als de update niets pakte maar het token wel geldig lijkt", async () => {
    sqlMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ verloopt_op: morgen, gebruikt_op: null }]);

    expect(await verzilverToken("race")).toEqual({
      gelukt: false,
      reden: "gebruikt",
    });
  });
});
