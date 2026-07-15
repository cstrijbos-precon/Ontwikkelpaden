import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useOntwikkelpaden } from "@/hooks/useOntwikkelpaden";
import { createInitialState } from "@/lib/initial-state";

vi.mock("@/lib/load-active-gesprek", () => ({
  loadActiveGesprek: vi.fn(),
}));

vi.mock("@/services/gesprekken-client", () => ({
  saveGesprek: vi.fn(),
}));

vi.mock("@/lib/export-word", () => ({
  exportWord: vi.fn(),
}));

import { loadActiveGesprek } from "@/lib/load-active-gesprek";
import { saveGesprek } from "@/services/gesprekken-client";

describe("useOntwikkelpaden", () => {
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
    });

    const { result } = renderHook(() => useOntwikkelpaden());

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.state.naam).toBe("Jan");
    expect(result.current.loadError).toBe("");
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
    });
    const { exportWord } = await import("@/lib/export-word");

    const { result } = renderHook(() => useOntwikkelpaden());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.handleExport();
    });
    expect(exportWord).toHaveBeenCalled();
  });
});
