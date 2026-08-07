import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/gesprekken/import-docx/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/parse-gesprek-docx", () => ({
  parseGesprekDocx: vi.fn(),
}));

vi.mock("@/lib/parse-gesprek-pdf", () => ({
  parseGesprekPdf: vi.fn(),
}));

import { parseGesprekDocx } from "@/lib/parse-gesprek-docx";
import { parseGesprekPdf } from "@/lib/parse-gesprek-pdf";

/**
 * Bouwt een minimale Request-stub met een échte FormData: `new Request(url, {
 * body: formData })` levert in de jsdom-testomgeving een Request op die de
 * multipart-body niet correct kan encoderen/parsen (cross-realm FormData/File
 * mismatch tussen jsdom en undici), dus we geven de route direct de FormData
 * terug via een object dat alleen `formData()` implementeert.
 */
function requestWithFile(file: File | null) {
  const formData = new FormData();
  if (file) formData.append("file", file);
  return { formData: () => Promise.resolve(formData) } as unknown as Request;
}

/**
 * jsdom's File mist arrayBuffer()/text(), dus die vullen we hier zelf aan.
 * De eerste bytes doen ertoe: de route herkent het type aan de signatuur.
 */
const SIGNATUREN = {
  docx: [0x50, 0x4b, 0x03, 0x04],
  pdf: [0x25, 0x50, 0x44, 0x46],
  onbekend: [0x00, 0x00, 0x00, 0x00],
} as const;

function fakeFile(
  size: number,
  soort: keyof typeof SIGNATUREN = "docx",
  name = "g.docx",
) {
  const bytes = new Uint8Array(Math.max(size, 4));
  bytes.set(SIGNATUREN[soort], 0);
  const file = new File([bytes], name);
  Object.defineProperty(file, "size", { value: size });
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => bytes.buffer,
  });
  return file;
}

/** Kortere naam voor de veelgebruikte docx-variant. */
const fakeDocxFile = (size: number, name = "g.docx") =>
  fakeFile(size, "docx", name);

describe("POST /api/gesprekken/import-docx", () => {
  it("returns 401 without session", async () => {
    mockAuth(null);
    const res = await POST(requestWithFile(fakeDocxFile(1)));
    expect(res.status).toBe(401);
  });

  it("returns 400 when no file is sent", async () => {
    mockAuthUser();
    const res = await POST(requestWithFile(null));
    expect(res.status).toBe(400);
  });

  it("returns 400 when the file is too large", async () => {
    mockAuthUser();
    const big = fakeDocxFile(10 * 1024 * 1024 + 1);
    const res = await POST(requestWithFile(big));
    expect(res.status).toBe(400);
  });

  it("returns 400 when parsing fails", async () => {
    mockAuthUser();
    vi.mocked(parseGesprekDocx).mockRejectedValue(
      new Error("Geen geldig .docx-bestand (word/document.xml ontbreekt)."),
    );

    const res = await POST(requestWithFile(fakeDocxFile(1)));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("Geen geldig .docx-bestand");
  });

  it("returns the parsed state and warnings on success", async () => {
    mockAuthUser();
    vi.mocked(parseGesprekDocx).mockResolvedValue({
      state: { naam: "Piet" },
      warnings: ["let op"],
    });

    const res = await POST(requestWithFile(fakeDocxFile(1)));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      state: { naam: "Piet" },
      warnings: ["let op"],
    });
  });

  it("stuurt een PDF naar de pdf-lezer", async () => {
    mockAuthUser();
    vi.mocked(parseGesprekPdf).mockResolvedValue({
      state: { naam: "Roos" },
      warnings: [],
    });

    const res = await POST(
      requestWithFile(fakeFile(1, "pdf", "oud-gesprek.pdf")),
    );

    expect(res.status).toBe(200);
    expect(parseGesprekPdf).toHaveBeenCalled();
    expect((await res.json()).state).toEqual({ naam: "Roos" });
  });

  it("kijkt naar de inhoud, niet naar de bestandsnaam", async () => {
    mockAuthUser();
    vi.mocked(parseGesprekPdf).mockResolvedValue({ state: {}, warnings: [] });

    // Een PDF die per ongeluk .docx heet, hoort alsnog goed te gaan.
    await POST(requestWithFile(fakeFile(1, "pdf", "verkeerde-naam.docx")));
    expect(parseGesprekPdf).toHaveBeenCalled();
  });

  it("weigert een bestandstype dat we niet kennen", async () => {
    mockAuthUser();
    const res = await POST(requestWithFile(fakeFile(1, "onbekend", "a.txt")));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("Alleen Word");
  });
});
