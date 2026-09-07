import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/trainingslijnen/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

const origineleFetch = global.fetch;

function navigatorData(data: Record<string, unknown>) {
  return {
    ok: true,
    json: async () => ({ data, version: 1 }),
  };
}

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = origineleFetch;
});

describe("GET /api/trainingslijnen", () => {
  it("weigert zonder sessie", async () => {
    mockAuth(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("filtert terugkerende programma's (Kickstart) zonder dagdelen eruit", async () => {
    mockAuthUser();
    vi.mocked(global.fetch).mockResolvedValue(
      navigatorData({
        Kickstart: { kind: "recurring", sessions: [{ datum: "1-1-2026" }] },
        "Adviseur 1-2": {
          kind: "content",
          blocks: [
            { kind: "dagdeel", label: "Dagdeel 1", date: "september 2026" },
            { kind: "module", type: "Training" },
          ],
        },
      }) as unknown as Response,
    );

    const res = await GET();
    const body = await res.json();

    expect(body.lijnen).toEqual([
      {
        naam: "Adviseur 1-2",
        dagdelen: [{ label: "Dagdeel 1", datum: "september 2026" }],
      },
    ]);
  });

  it("maakt een meerregelig label schoon tot één regel", async () => {
    mockAuthUser();
    vi.mocked(global.fetch).mockResolvedValue(
      navigatorData({
        "Vakexpert 1-2": {
          blocks: [
            {
              kind: "dagdeel",
              label: "Dagdeel 1\nRol, schrijven\n& presenteren",
              date: "",
            },
          ],
        },
      }) as unknown as Response,
    );

    const res = await GET();
    const body = await res.json();

    expect(body.lijnen[0].dagdelen[0].label).toBe(
      "Dagdeel 1 Rol, schrijven & presenteren",
    );
  });

  it("meldt een duidelijke fout als de navigator niet bereikbaar is", async () => {
    mockAuthUser();
    vi.mocked(global.fetch).mockRejectedValue(new Error("timeout"));

    const res = await GET();
    expect(res.status).toBe(502);
  });

  it("meldt een fout als de navigator een foutstatus teruggeeft", async () => {
    mockAuthUser();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const res = await GET();
    expect(res.status).toBe(502);
  });
});
