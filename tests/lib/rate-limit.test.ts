import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  beperk,
  clientIp,
  isGeblokkeerd,
  registreerMislukking,
  teVeelAanvragen,
  wisTeller,
} from "@/lib/rate-limit";

const sqlMock = vi.fn();
let database = true;

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
  hasDatabase: () => database,
}));

const LIMIET = { max: 3, vensterSeconden: 60 };

beforeEach(() => {
  sqlMock.mockReset();
  database = true;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(Math, "random").mockReturnValue(0.5); // geen opruimronde
});

describe("beperk", () => {
  it("laat aanroepen door tot en met de limiet", async () => {
    sqlMock.mockResolvedValueOnce([{ aantal: 3, rest: 40 }]);
    expect(await beperk("sleutel", LIMIET)).toEqual({
      toegestaan: true,
      opnieuwOverSeconden: 0,
    });
  });

  it("blokkeert zodra de limiet overschreden is en zegt hoe lang nog", async () => {
    sqlMock.mockResolvedValueOnce([{ aantal: 4, rest: 40 }]);
    expect(await beperk("sleutel", LIMIET)).toEqual({
      toegestaan: false,
      opnieuwOverSeconden: 40,
    });
  });

  it("geeft het venster door aan de query, zodat verlopen tellers opnieuw beginnen", async () => {
    sqlMock.mockResolvedValueOnce([{ aantal: 1, rest: 60 }]);
    await beperk("sleutel", LIMIET);
    // Eerste waarde is de sleutel, daarna het venster (drie keer gebruikt).
    expect(sqlMock.mock.calls[0]).toContain("sleutel");
    expect(sqlMock.mock.calls[0]).toContain(60);
  });

  it("laat verkeer door zonder database", async () => {
    database = false;
    expect((await beperk("sleutel", LIMIET)).toegestaan).toBe(true);
    expect(sqlMock).not.toHaveBeenCalled();
  });

  it("laat verkeer door als de database faalt, in plaats van iedereen buiten te sluiten", async () => {
    sqlMock.mockRejectedValueOnce(new Error("db weg"));
    expect((await beperk("sleutel", LIMIET)).toegestaan).toBe(true);
  });

  it("ruimt af en toe verlopen rijen op", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.001);
    sqlMock
      .mockResolvedValueOnce([{ aantal: 1, rest: 60 }])
      .mockResolvedValueOnce([]);

    await beperk("sleutel", LIMIET);

    const opruimen = sqlMock.mock.calls.find((call) =>
      (call[0] as TemplateStringsArray)
        .join("")
        .includes("DELETE FROM rate_limits"),
    );
    expect(opruimen).toBeDefined();
  });
});

describe("isGeblokkeerd", () => {
  it("blokkeert zodra de limiet bereikt is — zonder mee te tellen", async () => {
    sqlMock.mockResolvedValueOnce([{ aantal: 3, rest: 30 }]);

    expect(await isGeblokkeerd("sleutel", LIMIET)).toEqual({
      toegestaan: false,
      opnieuwOverSeconden: 30,
    });
    const tekst = (sqlMock.mock.calls[0]?.[0] as TemplateStringsArray).join("");
    expect(tekst).not.toContain("INSERT");
  });

  it("laat door onder de limiet", async () => {
    sqlMock.mockResolvedValueOnce([{ aantal: 2, rest: 30 }]);
    expect((await isGeblokkeerd("sleutel", LIMIET)).toegestaan).toBe(true);
  });

  it("laat door als er nog nooit geteld is", async () => {
    sqlMock.mockResolvedValueOnce([]);
    expect((await isGeblokkeerd("sleutel", LIMIET)).toegestaan).toBe(true);
  });

  it("laat door als de database faalt", async () => {
    sqlMock.mockRejectedValueOnce(new Error("db weg"));
    expect((await isGeblokkeerd("sleutel", LIMIET)).toegestaan).toBe(true);
  });
});

describe("registreerMislukking en wisTeller", () => {
  it("telt een mislukking bij", async () => {
    sqlMock.mockResolvedValueOnce([{ aantal: 1, rest: 60 }]);
    await registreerMislukking("sleutel", LIMIET);

    const tekst = (sqlMock.mock.calls[0]?.[0] as TemplateStringsArray).join("");
    expect(tekst).toContain("INSERT INTO rate_limits");
  });

  it("wist een teller", async () => {
    sqlMock.mockResolvedValueOnce([]);
    await wisTeller("sleutel");

    const tekst = (sqlMock.mock.calls[0]?.[0] as TemplateStringsArray).join("");
    expect(tekst).toContain("DELETE FROM rate_limits");
    expect(sqlMock.mock.calls[0]).toContain("sleutel");
  });

  it("laat wissen niet falen als de database weg is", async () => {
    sqlMock.mockRejectedValueOnce(new Error("db weg"));
    await expect(wisTeller("sleutel")).resolves.toBeUndefined();
  });
});

describe("clientIp", () => {
  it("neemt het eerste adres uit x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(clientIp(headers)).toBe("203.0.113.7");
  });

  it("valt terug op x-real-ip", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe(
      "198.51.100.2",
    );
  });

  it("valt terug op 'onbekend' zonder headers", () => {
    expect(clientIp(new Headers())).toBe("onbekend");
  });
});

describe("teVeelAanvragen", () => {
  it("geeft 429 met een Retry-After", async () => {
    const res = teVeelAanvragen({ toegestaan: false, opnieuwOverSeconden: 75 });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("75");
  });

  it("zet Retry-After nooit op 0", () => {
    const res = teVeelAanvragen({ toegestaan: false, opnieuwOverSeconden: 0 });
    expect(res.headers.get("Retry-After")).toBe("1");
  });
});
