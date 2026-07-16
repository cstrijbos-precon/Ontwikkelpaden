import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/gesprekken/import-docx/route";
import { mockAuth, mockAuthUser } from "@/tests/helpers/auth-mock";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/parse-gesprek-docx", () => ({
  parseGesprekDocx: vi.fn(),
}));

import { parseGesprekDocx } from "@/lib/parse-gesprek-docx";

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

/** jsdom's File mist arrayBuffer()/text(), dus die vullen we hier zelf aan. */
function fakeDocxFile(size: number, name = "g.docx") {
  const file = new File([new Uint8Array(size)], name);
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => new ArrayBuffer(size),
  });
  return file;
}

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
});
