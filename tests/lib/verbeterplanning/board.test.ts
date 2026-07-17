import { beforeEach, describe, expect, it, vi } from "vitest";
import { AGENDA_MONTHS, MONTHS } from "@/lib/verbeterplanning/constants";

const sqlMock = vi.fn();

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
}));

import { getBoard } from "@/lib/verbeterplanning/board";

describe("getBoard", () => {
  beforeEach(() => {
    sqlMock.mockReset();
  });

  it("assembles a full board from the 9 underlying queries", async () => {
    sqlMock
      .mockResolvedValueOnce([
        {
          code: "KMO01",
          title: "Titel",
          mtlid: "Ard",
          trekker: "Judith",
          team: "",
          rg: "",
          kpi: "Doel",
          group: "Klant- & Marktontwikkeling",
        },
      ]) // projects
      .mockResolvedValueOnce([
        { project_code: "KMO01", month_index: 2, status: "green" },
      ]) // project status
      .mockResolvedValueOnce([
        { id: "ms1", project_code: "KMO01", name: "Milestone 1" },
      ]) // milestones
      .mockResolvedValueOnce([
        { milestone_id: "ms1", month_index: 3, status: "amber" },
      ]) // milestone status
      .mockResolvedValueOnce([
        {
          id: "kpi1",
          project_code: "KMO01",
          type: "resultaat",
          description: "Omzet",
        },
      ]) // kpis
      .mockResolvedValueOnce([
        { kpi_id: "kpi1", quarter_index: 1, status: "red" },
      ]) // kpi status
      .mockResolvedValueOnce([
        { kpi_id: "kpi1", quarter_index: 1, note: "opmerking" },
      ]) // kpi notes
      .mockResolvedValueOnce([
        {
          id: "upd1",
          project_code: "KMO01",
          text: "Update tekst",
          created_by: "u@precon.nl",
          created_at: "2026-01-01T00:00:00Z",
        },
      ]) // updates
      .mockResolvedValueOnce([
        {
          month_index: 0,
          datum: "1 juni",
          projecten: "KMO01",
          opmerkingen: "",
        },
      ]); // agenda

    const board = await getBoard();

    expect(board.projects).toHaveLength(1);
    const project = board.projects[0];
    expect(project?.code).toBe("KMO01");
    expect(project?.statuses).toHaveLength(MONTHS.length);
    expect(project?.statuses[2]).toBe("green");
    expect(project?.statuses[0]).toBe("");
    expect(project?.milestones).toHaveLength(1);
    expect(project?.milestones[0]?.statuses[3]).toBe("amber");
    expect(project?.kpis).toHaveLength(1);
    expect(project?.kpis[0]?.quarters[1]).toEqual({
      status: "red",
      note: "opmerking",
    });
    expect(project?.updates).toHaveLength(1);
    expect(project?.updates[0]?.text).toBe("Update tekst");

    expect(board.agenda).toHaveLength(AGENDA_MONTHS.length);
    expect(board.agenda[0]?.datum).toBe("1 juni");
    expect(board.agenda[1]?.datum).toBe("");
  });

  it("fills defaults when there is no data at all", async () => {
    sqlMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const board = await getBoard();
    expect(board.projects).toEqual([]);
    expect(board.agenda).toHaveLength(AGENDA_MONTHS.length);
    expect(board.agenda.every((entry) => entry.datum === "")).toBe(true);
  });
});
