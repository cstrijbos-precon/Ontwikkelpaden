import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVerbeterplanning } from "@/hooks/useVerbeterplanning";
import type { VerbeterplanningBoard } from "@/lib/verbeterplanning/types";

vi.mock("@/services/verbeterplanning-client", () => ({
  fetchBoard: vi.fn(),
  createProject: vi.fn(),
  updateProjectMeta: vi.fn(),
  setProjectStatus: vi.fn(),
  createMilestone: vi.fn(),
  renameMilestone: vi.fn(),
  deleteMilestone: vi.fn(),
  setMilestoneStatus: vi.fn(),
  createKpi: vi.fn(),
  updateKpi: vi.fn(),
  deleteKpi: vi.fn(),
  setKpiStatus: vi.fn(),
  setKpiNote: vi.fn(),
  createUpdate: vi.fn(),
  editUpdate: vi.fn(),
  deleteUpdate: vi.fn(),
  setAgendaField: vi.fn(),
}));

import * as client from "@/services/verbeterplanning-client";

function baseBoard(): VerbeterplanningBoard {
  return {
    projects: [
      {
        code: "KMO01",
        title: "Titel",
        mtlid: "Ard",
        trekker: "Judith",
        team: "",
        rg: "",
        kpi: "",
        group: "Klant- & Marktontwikkeling",
        statuses: new Array(33).fill(""),
        milestones: [
          { id: "ms1", name: "Milestone 1", statuses: new Array(33).fill("") },
        ],
        kpis: [
          {
            id: "kpi1",
            type: "resultaat",
            description: "",
            quarters: new Array(8)
              .fill(null)
              .map(() => ({ status: "" as const, note: "" })),
          },
        ],
        updates: [
          {
            id: "upd1",
            text: "Bestaande update",
            createdBy: "u@precon.nl",
            createdAt: "2026-01-01T00:00:00Z",
          },
        ],
      },
    ],
    agenda: [{ monthIndex: 0, datum: "", projecten: "", opmerkingen: "" }],
  };
}

async function mountLoaded() {
  vi.mocked(client.fetchBoard).mockResolvedValue(baseBoard());
  const view = renderHook(() => useVerbeterplanning());
  await waitFor(() => expect(view.result.current.hydrated).toBe(true));
  return view;
}

describe("useVerbeterplanning", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });
  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  it("loads the board on mount", async () => {
    const { result } = await mountLoaded();
    expect(result.current.board?.projects).toHaveLength(1);
    expect(result.current.loadError).toBe("");
  });

  it("surfaces a load error", async () => {
    vi.mocked(client.fetchBoard).mockRejectedValue(new Error("DB down"));
    const { result } = renderHook(() => useVerbeterplanning());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.loadError).toBe("DB down");
  });

  it("refresh() reloads the board", async () => {
    const { result } = await mountLoaded();
    const updated = baseBoard();
    const [firstProject] = updated.projects;
    if (firstProject) firstProject.title = "Nieuwe titel";
    vi.mocked(client.fetchBoard).mockResolvedValue(updated);

    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.board?.projects[0]?.title).toBe("Nieuwe titel");
  });

  it("cycleProjectStatus optimistically updates then confirms", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.setProjectStatus).mockResolvedValue(undefined);

    await act(async () => {
      await result.current.cycleProjectStatus("KMO01", 0);
    });

    expect(result.current.board?.projects[0]?.statuses[0]).toBe("green");
    expect(client.setProjectStatus).toHaveBeenCalledWith("KMO01", 0, "green");
  });

  it("cycleProjectStatus rolls back the cell on API failure", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.setProjectStatus).mockRejectedValue(new Error("mislukt"));

    await act(async () => {
      await expect(
        result.current.cycleProjectStatus("KMO01", 0),
      ).rejects.toThrow("mislukt");
    });

    expect(result.current.board?.projects[0]?.statuses[0]).toBe("");
  });

  it("addProject appends the new project with empty state arrays", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.createProject).mockResolvedValue({
      code: "KMO09",
      title: "Nieuw project",
      mtlid: "",
      trekker: "",
      team: "",
      rg: "",
      kpi: "",
      group: "Impact improvement",
    });

    await act(async () => {
      await result.current.addProject({
        code: "KMO09",
        title: "Nieuw project",
        group: "Impact improvement",
      });
    });

    const added = result.current.board?.projects.find(
      (p) => p.code === "KMO09",
    );
    expect(added?.statuses).toHaveLength(33);
    expect(added?.milestones).toEqual([]);
  });

  it("cycleMilestoneStatus updates the right milestone", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.setMilestoneStatus).mockResolvedValue(undefined);

    await act(async () => {
      await result.current.cycleMilestoneStatus("ms1", 2);
    });

    expect(result.current.board?.projects[0]?.milestones[0]?.statuses[2]).toBe(
      "green",
    );
  });

  it("deleteMilestone removes it from the project", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.deleteMilestone).mockResolvedValue(undefined);

    await act(async () => {
      await result.current.deleteMilestone("KMO01", "ms1");
    });

    expect(result.current.board?.projects[0]?.milestones).toEqual([]);
  });

  it("addMilestone appends a milestone with empty statuses", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.createMilestone).mockResolvedValue({
      id: "ms2",
      projectCode: "KMO01",
      name: "Nieuwe milestone",
    });

    await act(async () => {
      await result.current.addMilestone("KMO01", "Nieuwe milestone");
    });

    const milestones = result.current.board?.projects[0]?.milestones ?? [];
    expect(milestones).toHaveLength(2);
    expect(milestones[1]?.statuses).toHaveLength(33);
  });

  it("renameMilestone updates the milestone name", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.renameMilestone).mockResolvedValue({
      id: "ms1",
      projectCode: "KMO01",
      name: "Hernoemd",
    });

    await act(async () => {
      await result.current.renameMilestone("KMO01", "ms1", "Hernoemd");
    });

    expect(result.current.board?.projects[0]?.milestones[0]?.name).toBe(
      "Hernoemd",
    );
  });

  it("cycleKpiStatus updates the right kpi quarter", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.setKpiStatus).mockResolvedValue(undefined);

    await act(async () => {
      await result.current.cycleKpiStatus("kpi1", 0);
    });

    expect(
      result.current.board?.projects[0]?.kpis[0]?.quarters[0]?.status,
    ).toBe("green");
  });

  it("deleteKpi removes it from the project", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.deleteKpi).mockResolvedValue(undefined);

    await act(async () => {
      await result.current.deleteKpi("KMO01", "kpi1");
    });

    expect(result.current.board?.projects[0]?.kpis).toEqual([]);
  });

  it("editKpi updates type and description", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.updateKpi).mockResolvedValue({
      id: "kpi1",
      projectCode: "KMO01",
      type: "activiteit",
      description: "Nieuwe omschrijving",
    });

    await act(async () => {
      await result.current.editKpi("KMO01", "kpi1", {
        type: "activiteit",
        description: "Nieuwe omschrijving",
      });
    });

    const kpi = result.current.board?.projects[0]?.kpis[0];
    expect(kpi?.type).toBe("activiteit");
    expect(kpi?.description).toBe("Nieuwe omschrijving");
  });

  it("cycleKpiStatus rolls back on API failure", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.setKpiStatus).mockRejectedValue(new Error("mislukt"));

    await act(async () => {
      await expect(result.current.cycleKpiStatus("kpi1", 0)).rejects.toThrow(
        "mislukt",
      );
    });

    expect(
      result.current.board?.projects[0]?.kpis[0]?.quarters[0]?.status,
    ).toBe("");
  });

  it("cycleKpiStatus / cycleMilestoneStatus are no-ops for an unknown id", async () => {
    const { result } = await mountLoaded();
    await act(async () => {
      await result.current.cycleKpiStatus("unknown-kpi", 0);
      await result.current.cycleMilestoneStatus("unknown-ms", 0);
    });
    expect(client.setKpiStatus).not.toHaveBeenCalled();
    expect(client.setMilestoneStatus).not.toHaveBeenCalled();
  });

  it("flushKpiNote cancels the pending debounce and saves immediately", async () => {
    const { result } = await mountLoaded();
    vi.useFakeTimers();

    act(() => {
      result.current.updateKpiNote("kpi1", 0, "typend...");
      result.current.flushKpiNote("kpi1", 0, "typend...");
    });
    expect(client.setKpiNote).toHaveBeenCalledWith("kpi1", 0, "typend...");

    client.setKpiNote.mockClear();
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(client.setKpiNote).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("updateKpiNote updates local state immediately and debounces the network call", async () => {
    const { result } = await mountLoaded();
    vi.useFakeTimers();

    act(() => {
      result.current.updateKpiNote("kpi1", 0, "typend...");
    });
    expect(result.current.board?.projects[0]?.kpis[0]?.quarters[0]?.note).toBe(
      "typend...",
    );
    expect(client.setKpiNote).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1600);
    });
    expect(client.setKpiNote).toHaveBeenCalledWith("kpi1", 0, "typend...");
    vi.useRealTimers();
  });

  it("addUpdate prepends the new update", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.createUpdate).mockResolvedValue({
      id: "upd2",
      text: "Nieuwe update",
      createdBy: "u@precon.nl",
      createdAt: "2026-02-01T00:00:00Z",
    });

    await act(async () => {
      await result.current.addUpdate("KMO01", "Nieuwe update");
    });

    expect(result.current.board?.projects[0]?.updates[0]?.id).toBe("upd2");
    expect(result.current.board?.projects[0]?.updates).toHaveLength(2);
  });

  it("deleteUpdate removes the matching update", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.deleteUpdate).mockResolvedValue(undefined);

    await act(async () => {
      await result.current.deleteUpdate("upd1");
    });

    expect(result.current.board?.projects[0]?.updates).toEqual([]);
  });

  it("editUpdate updates the matching update's text", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.editUpdate).mockResolvedValue({
      id: "upd1",
      text: "Bijgewerkte tekst",
      createdBy: "u@precon.nl",
      createdAt: "2026-01-01T00:00:00Z",
    });

    await act(async () => {
      await result.current.editUpdate("upd1", "Bijgewerkte tekst");
    });

    expect(result.current.board?.projects[0]?.updates[0]?.text).toBe(
      "Bijgewerkte tekst",
    );
  });

  it("editUpdate / deleteUpdate are no-ops for an unknown id", async () => {
    const { result } = await mountLoaded();
    await act(async () => {
      await result.current.editUpdate("unknown-upd", "x");
      await result.current.deleteUpdate("unknown-upd");
    });
    expect(client.editUpdate).not.toHaveBeenCalled();
    expect(client.deleteUpdate).not.toHaveBeenCalled();
  });

  it("editProjectMeta merges the returned fields into the board", async () => {
    const { result } = await mountLoaded();
    vi.mocked(client.updateProjectMeta).mockResolvedValue({
      code: "KMO01",
      title: "Nieuwe titel",
      mtlid: "Ard",
      trekker: "Judith",
      team: "",
      rg: "",
      kpi: "",
      group: "Klant- & Marktontwikkeling",
    });

    await act(async () => {
      await result.current.editProjectMeta("KMO01", { title: "Nieuwe titel" });
    });

    expect(result.current.board?.projects[0]?.title).toBe("Nieuwe titel");
  });

  it("updateAgendaField updates local state and debounces the network call", async () => {
    const { result } = await mountLoaded();
    vi.useFakeTimers();

    act(() => {
      result.current.updateAgendaField(0, "datum", "1 juni");
    });
    expect(result.current.board?.agenda[0]?.datum).toBe("1 juni");
    expect(client.setAgendaField).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1600);
    });
    expect(client.setAgendaField).toHaveBeenCalledWith(0, { datum: "1 juni" });
    vi.useRealTimers();
  });

  it("flushAgendaField cancels the pending debounce and saves immediately", async () => {
    const { result } = await mountLoaded();
    vi.useFakeTimers();

    act(() => {
      result.current.updateAgendaField(0, "projecten", "KMO01");
      result.current.flushAgendaField(0, "projecten", "KMO01");
    });
    expect(client.setAgendaField).toHaveBeenCalledWith(0, {
      projecten: "KMO01",
    });

    vi.mocked(client.setAgendaField).mockClear();
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(client.setAgendaField).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
