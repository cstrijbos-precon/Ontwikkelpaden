import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOntwikkelpaden } from "@/hooks/useOntwikkelpaden";
import { createInitialState } from "@/lib/initial-state";

vi.mock("@/lib/load-active-gesprek", () => ({
  loadActiveGesprek: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/gesprekken-client", () => ({
  saveGesprek: vi.fn(),
  importGesprekDocx: vi.fn(),
  fetchKnownUserEmails: vi.fn(),
  fetchGesprek: vi.fn(),
}));

vi.mock("@/lib/export-word", () => ({
  exportWord: vi.fn(),
}));

import { loadActiveGesprek } from "@/lib/load-active-gesprek";
import {
  fetchGesprek,
  fetchKnownUserEmails,
  importGesprekDocx,
  saveGesprek,
} from "@/services/gesprekken-client";

describe("useOntwikkelpaden", () => {
  beforeEach(() => {
    vi.mocked(fetchKnownUserEmails).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("loads gesprek on mount", async () => {
    const state = createInitialState();
    state.naam = "Jan";
    vi.mocked(loadActiveGesprek).mockResolvedValue({
      id: "g-1",
      state,
      status: "draft",
      previousGesprekId: null,
      medewerkerEmail: null,
    });

    const { result } = renderHook(() => useOntwikkelpaden());

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.state.naam).toBe("Jan");
    expect(result.current.loadError).toBe("");
  });

  it("loads an explicit gesprekId directly and skips loadActiveGesprek", async () => {
    const state = createInitialState();
    state.naam = "Expliciet";
    vi.mocked(fetchGesprek).mockResolvedValue({
      id: "g-9",
      state,
      status: "draft",
      previousGesprekId: null,
      medewerkerEmail: "mede@precon.nl",
    } as Awaited<ReturnType<typeof fetchGesprek>>);

    const { result } = renderHook(() => useOntwikkelpaden("g-9"));

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(fetchGesprek).toHaveBeenCalledWith("g-9");
    expect(loadActiveGesprek).not.toHaveBeenCalled();
    expect(result.current.state.naam).toBe("Expliciet");
    expect(result.current.medewerkerEmail).toBe("mede@precon.nl");
  });

  it("shows load error on failure", async () => {
    vi.mocked(loadActiveGesprek).mockRejectedValue(new Error("DB down"));

    const { result } = renderHook(() => useOntwikkelpaden());

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.loadError).toBe("DB down");
  });

  it("updates fields and saves manually", async () => {
    const state = createInitialState();
    vi.mocked(loadActiveGesprek).mockResolvedValue({
      id: "g-1",
      state,
      status: "draft",
      previousGesprekId: null,
      medewerkerEmail: null,
    });
    vi.mocked(saveGesprek).mockResolvedValue(
      {} as Awaited<ReturnType<typeof saveGesprek>>,
    );

    const { result } = renderHook(() => useOntwikkelpaden());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.updateField("naam", "Piet");
    });
    expect(result.current.state.naam).toBe("Piet");

    await act(async () => {
      result.current.handleSave();
    });
    expect(saveGesprek).toHaveBeenCalled();
  });

  it("navigates between screens and toggles UI state", async () => {
    const state = createInitialState();
    vi.mocked(loadActiveGesprek).mockResolvedValue({
      id: "g-1",
      state,
      status: "draft",
      previousGesprekId: null,
      medewerkerEmail: null,
    });
    vi.mocked(saveGesprek).mockResolvedValue(
      {} as Awaited<ReturnType<typeof saveGesprek>>,
    );

    const scrollMock = vi.fn();
    vi.stubGlobal("scrollTo", scrollMock);

    const { result } = renderHook(() => useOntwikkelpaden());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.toggleComp("b");
      result.current.toggleSter("b");
      result.current.togglePopPad("vakexpert");
      result.current.toggleToolbox("vakexpert");
      result.current.setVorigJaar("vakexpert", 3);
      result.current.toggleAmbitie("adviseur");
      result.current.setTrainingsgroep("adviseur", "groep-1");
      result.current.toggleTCell(1, 2);
      result.current.updateSituatie(0, "situatie");
      result.current.updateOpmerking("b", "goed");
    });

    expect(result.current.openComps.has("b")).toBe(true);
    expect(result.current.state.ambities.adviseur).toBe(true);
    expect(result.current.state.trainingsgroepen.adviseur).toBe("groep-1");
    expect(result.current.state.tCellen).toContain("1-2");

    // De trainingsgroep staat los van de ambitie en blijft dus staan.
    act(() => {
      result.current.toggleAmbitie("adviseur");
    });
    expect(result.current.state.ambities.adviseur).toBe(false);
    expect(result.current.state.trainingsgroepen.adviseur).toBe("groep-1");

    // Een verschoven bolletje kan hersteld worden naar de berekening.
    act(() => {
      result.current.setNiveauCorrectie("leider", 4);
    });
    expect(result.current.state.niveauCorrectie.leider).toBe(4);
    act(() => {
      result.current.setNiveauCorrectie("leider", null);
    });
    expect(result.current.state.niveauCorrectie.leider).toBeNull();

    await act(async () => {
      result.current.volgende();
    });
    expect(result.current.huidig).toBe(1);
    expect(scrollMock).toHaveBeenCalled();

    act(() => {
      result.current.terug();
    });
    expect(result.current.huidig).toBe(0);
  });

  it("exposes status/previousGesprekId and reflectie-handlers", async () => {
    const state = createInitialState();
    vi.mocked(loadActiveGesprek).mockResolvedValue({
      id: "g-1",
      state,
      status: "completed",
      previousGesprekId: "g-0",
      medewerkerEmail: null,
    });

    const { result } = renderHook(() => useOntwikkelpaden());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.status).toBe("completed");
    expect(result.current.previousGesprekId).toBe("g-0");

    act(() => {
      result.current.addReflectie();
    });
    expect(result.current.state.reflecties).toHaveLength(1);

    const id = result.current.state.reflecties[0]?.id as string;
    act(() => {
      result.current.updateReflectie(id, { tekst: "Tussentijds" });
    });
    expect(result.current.state.reflecties[0]?.tekst).toBe("Tussentijds");

    act(() => {
      result.current.removeReflectie(id);
    });
    expect(result.current.state.reflecties).toHaveLength(0);
  });

  it("calls exportWord on handleExport", async () => {
    const state = createInitialState();
    vi.mocked(loadActiveGesprek).mockResolvedValue({
      id: "g-1",
      state,
      status: "draft",
      previousGesprekId: null,
      medewerkerEmail: null,
    });
    const { exportWord } = await import("@/lib/export-word");

    const { result } = renderHook(() => useOntwikkelpaden());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.handleExport();
    });
    expect(exportWord).toHaveBeenCalled();
  });

  it("merges parsed docx state and reports warnings on import", async () => {
    const state = createInitialState();
    vi.mocked(loadActiveGesprek).mockResolvedValue({
      id: "g-1",
      state,
      status: "draft",
      previousGesprekId: null,
      medewerkerEmail: null,
    });
    vi.mocked(importGesprekDocx).mockResolvedValue({
      state: { naam: "Uit document" },
      warnings: ["Sectie X niet herkend"],
    });

    const { result } = renderHook(() => useOntwikkelpaden());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    const file = new File(["inhoud"], "gesprek.docx");
    await act(async () => {
      await result.current.handleImportDocx(file);
    });

    expect(importGesprekDocx).toHaveBeenCalledWith(file);
    expect(result.current.state.naam).toBe("Uit document");
    expect(result.current.importWarnings).toEqual(["Sectie X niet herkend"]);

    act(() => {
      result.current.dismissImportWarnings();
    });
    expect(result.current.importWarnings).toEqual([]);
  });

  it("loads known emails and links the current user as medewerker", async () => {
    const state = createInitialState();
    vi.mocked(loadActiveGesprek).mockResolvedValue({
      id: "g-1",
      state,
      status: "draft",
      previousGesprekId: null,
      medewerkerEmail: null,
    });
    vi.mocked(fetchKnownUserEmails).mockResolvedValue([
      "a@precon.nl",
      "b@precon.nl",
    ]);
    vi.mocked(saveGesprek).mockResolvedValue(
      {} as Awaited<ReturnType<typeof saveGesprek>>,
    );

    const { result } = renderHook(() => useOntwikkelpaden());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await waitFor(() =>
      expect(result.current.knownEmails).toEqual([
        "a@precon.nl",
        "b@precon.nl",
      ]),
    );

    await act(async () => {
      await result.current.setMedewerkerEmail("a@precon.nl");
    });

    expect(result.current.medewerkerEmail).toBe("a@precon.nl");
    expect(saveGesprek).toHaveBeenCalledWith(
      "g-1",
      expect.anything(),
      undefined,
      "a@precon.nl",
    );
  });

  it("reverts medewerkerEmail when linking fails", async () => {
    const state = createInitialState();
    vi.mocked(loadActiveGesprek).mockResolvedValue({
      id: "g-1",
      state,
      status: "draft",
      previousGesprekId: null,
      medewerkerEmail: null,
    });
    vi.mocked(saveGesprek).mockRejectedValue(new Error("db"));

    const { result } = renderHook(() => useOntwikkelpaden());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(async () => {
      await result.current.setMedewerkerEmail("a@precon.nl");
    });

    expect(result.current.medewerkerEmail).toBeNull();
  });

  it("shows an error message when docx import fails", async () => {
    const state = createInitialState();
    vi.mocked(loadActiveGesprek).mockResolvedValue({
      id: "g-1",
      state,
      status: "draft",
      previousGesprekId: null,
      medewerkerEmail: null,
    });
    vi.mocked(importGesprekDocx).mockRejectedValue(
      new Error("Geen geldig .docx-bestand"),
    );

    const { result } = renderHook(() => useOntwikkelpaden());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    const file = new File(["inhoud"], "gesprek.docx");
    await act(async () => {
      await result.current.handleImportDocx(file);
    });

    expect(result.current.importWarnings).toEqual([
      "Geen geldig .docx-bestand",
    ]);
  });
});
