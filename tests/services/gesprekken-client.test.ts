import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/lib/initial-state";
import {
  createGesprek,
  fetchGesprek,
  fetchGesprekkenList,
  importGesprekDocx,
  saveGesprek,
  startNewCycle,
} from "@/services/gesprekken-client";

describe("gesprekken-client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchGesprekkenList returns items", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [{ id: "1" }] }),
      }),
    );

    const items = await fetchGesprekkenList();
    expect(items).toEqual([{ id: "1" }]);
    expect(fetch).toHaveBeenCalledWith("/api/gesprekken");
  });

  it("fetchGesprek loads by id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "abc", state: {} }),
      }),
    );

    const gesprek = await fetchGesprek("abc");
    expect(gesprek.id).toBe("abc");
  });

  it("createGesprek posts optional state", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "new" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const state = createInitialState();
    await createGesprek(state);

    expect(fetchMock).toHaveBeenCalledWith("/api/gesprekken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
  });

  it("saveGesprek puts state", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "abc" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const state = createInitialState();
    await saveGesprek("abc", state);

    expect(fetchMock).toHaveBeenCalledWith("/api/gesprekken/abc", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
  });

  it("saveGesprek includes status when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "abc" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const state = createInitialState();
    await saveGesprek("abc", state, "completed");

    expect(fetchMock).toHaveBeenCalledWith("/api/gesprekken/abc", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, status: "completed" }),
    });
  });

  it("startNewCycle posts to the next-cycle endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "gesprek-2" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const gesprek = await startNewCycle("gesprek-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/gesprekken/gesprek-1/next-cycle",
      { method: "POST" },
    );
    expect(gesprek.id).toBe("gesprek-2");
  });

  it("importGesprekDocx posts the file as form data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ state: { naam: "Piet" }, warnings: ["let op"] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["inhoud"], "gesprek.docx");
    const result = await importGesprekDocx(file);

    expect(result).toEqual({ state: { naam: "Piet" }, warnings: ["let op"] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/gesprekken/import-docx");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBe(file);
  });

  it("throws on error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      }),
    );

    await expect(fetchGesprekkenList()).rejects.toThrow("Unauthorized");
  });

  it("uses fallback message for non-JSON errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.reject(new Error("parse error")),
      }),
    );

    await expect(fetchGesprek("x")).rejects.toThrow("Verzoek mislukt");
  });
});
