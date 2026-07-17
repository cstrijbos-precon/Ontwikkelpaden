import { afterEach, describe, expect, it, vi } from "vitest";
import * as client from "@/services/verbeterplanning-client";

function okFetch(json: unknown) {
  return vi
    .fn()
    .mockResolvedValue({ ok: true, json: () => Promise.resolve(json) });
}

describe("verbeterplanning-client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchBoard GETs the board", async () => {
    const fetchMock = okFetch({ projects: [], agenda: [] });
    vi.stubGlobal("fetch", fetchMock);

    const board = await client.fetchBoard();
    expect(board).toEqual({ projects: [], agenda: [] });
    expect(fetchMock).toHaveBeenCalledWith("/api/verbeterplanning");
  });

  it("createProject POSTs the input", async () => {
    const fetchMock = okFetch({ code: "KMO09" });
    vi.stubGlobal("fetch", fetchMock);

    await client.createProject({
      code: "KMO09",
      title: "Titel",
      group: "Impact improvement",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/verbeterplanning/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "KMO09",
        title: "Titel",
        group: "Impact improvement",
      }),
    });
  });

  it("updateProjectMeta PATCHes the given fields", async () => {
    const fetchMock = okFetch({ code: "KMO01" });
    vi.stubGlobal("fetch", fetchMock);

    await client.updateProjectMeta("KMO01", { title: "Nieuw" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/verbeterplanning/projects/KMO01",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ title: "Nieuw" }),
      }),
    );
  });

  it("setProjectStatus PATCHes monthIndex + status", async () => {
    const fetchMock = okFetch({});
    vi.stubGlobal("fetch", fetchMock);

    await client.setProjectStatus("KMO01", 3, "green");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/verbeterplanning/projects/KMO01/status",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthIndex: 3, status: "green" }),
      },
    );
  });

  it("createMilestone POSTs to the project's milestones endpoint", async () => {
    const fetchMock = okFetch({ id: "ms1" });
    vi.stubGlobal("fetch", fetchMock);

    await client.createMilestone("KMO01", "Naam");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/verbeterplanning/projects/KMO01/milestones",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("renameMilestone PATCHes the milestone's name", async () => {
    const fetchMock = okFetch({ id: "ms1" });
    vi.stubGlobal("fetch", fetchMock);

    await client.renameMilestone("ms1", "Nieuwe naam");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/verbeterplanning/milestones/ms1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Nieuwe naam" }),
      }),
    );
  });

  it("setMilestoneStatus PATCHes monthIndex + status", async () => {
    const fetchMock = okFetch({});
    vi.stubGlobal("fetch", fetchMock);

    await client.setMilestoneStatus("ms1", 1, "amber");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/verbeterplanning/milestones/ms1/status",
      expect.objectContaining({
        body: JSON.stringify({ monthIndex: 1, status: "amber" }),
      }),
    );
  });

  it("deleteMilestone sends a DELETE request", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fetchMock);

    await client.deleteMilestone("ms1");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/verbeterplanning/milestones/ms1",
      { method: "DELETE" },
    );
  });

  it("createKpi POSTs type and description", async () => {
    const fetchMock = okFetch({ id: "kpi1" });
    vi.stubGlobal("fetch", fetchMock);

    await client.createKpi("KMO01", "resultaat", "Omschrijving");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/verbeterplanning/projects/KMO01/kpis",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          type: "resultaat",
          description: "Omschrijving",
        }),
      }),
    );
  });

  it("updateKpi PATCHes the given fields", async () => {
    const fetchMock = okFetch({ id: "kpi1" });
    vi.stubGlobal("fetch", fetchMock);

    await client.updateKpi("kpi1", { description: "Nieuw" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/verbeterplanning/kpis/kpi1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ description: "Nieuw" }),
      }),
    );
  });

  it("setKpiStatus PATCHes quarterIndex and status", async () => {
    const fetchMock = okFetch({});
    vi.stubGlobal("fetch", fetchMock);

    await client.setKpiStatus("kpi1", 3, "red");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/verbeterplanning/kpis/kpi1/status",
      expect.objectContaining({
        body: JSON.stringify({ quarterIndex: 3, status: "red" }),
      }),
    );
  });

  it("setKpiNote PATCHes quarterIndex and note", async () => {
    const fetchMock = okFetch({});
    vi.stubGlobal("fetch", fetchMock);

    await client.setKpiNote("kpi1", 2, "opmerking");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/verbeterplanning/kpis/kpi1/note",
      expect.objectContaining({
        body: JSON.stringify({ quarterIndex: 2, note: "opmerking" }),
      }),
    );
  });

  it("createUpdate / editUpdate / deleteUpdate hit the right endpoints", async () => {
    const fetchMock = okFetch({ id: "upd1" });
    vi.stubGlobal("fetch", fetchMock);

    await client.createUpdate("KMO01", "tekst");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/verbeterplanning/projects/KMO01/updates",
      expect.objectContaining({ method: "POST" }),
    );

    await client.editUpdate("upd1", "tekst2");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/verbeterplanning/updates/upd1",
      expect.objectContaining({ method: "PATCH" }),
    );

    await client.deleteUpdate("upd1");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/verbeterplanning/updates/upd1",
      { method: "DELETE" },
    );
  });

  it("setAgendaField PATCHes the given month", async () => {
    const fetchMock = okFetch({ monthIndex: 0 });
    vi.stubGlobal("fetch", fetchMock);

    await client.setAgendaField(0, { datum: "1 juni" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/verbeterplanning/agenda/0",
      expect.objectContaining({ body: JSON.stringify({ datum: "1 juni" }) }),
    );
  });

  it("throws the server error message on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Niet gevonden" }),
      }),
    );

    await expect(client.fetchBoard()).rejects.toThrow("Niet gevonden");
  });

  it("deleteKpi throws the server error message on a non-ok DELETE", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Mislukt" }),
      }),
    );

    await expect(client.deleteKpi("kpi1")).rejects.toThrow("Mislukt");
  });
});
