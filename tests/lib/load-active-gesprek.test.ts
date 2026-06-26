import { afterEach, describe, expect, it, vi } from "vitest";
import * as session from "@/lib/gesprekken-session";
import { createInitialState } from "@/lib/initial-state";
import { loadActiveGesprek } from "@/lib/load-active-gesprek";
import * as client from "@/services/gesprekken-client";

vi.mock("@/services/gesprekken-client");
vi.mock("@/lib/gesprekken-session");

const mockState = createInitialState();
mockState.naam = "Test";

describe("loadActiveGesprek", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("loads gesprek by stored id", async () => {
    vi.mocked(session.getStoredGesprekId).mockReturnValue("stored-id");
    vi.mocked(client.fetchGesprek).mockResolvedValue({
      id: "stored-id",
      state: mockState,
    } as Awaited<ReturnType<typeof client.fetchGesprek>>);

    const result = await loadActiveGesprek();
    expect(result.id).toBe("stored-id");
    expect(result.state.naam).toBe("Test");
    expect(session.setStoredGesprekId).toHaveBeenCalledWith("stored-id");
  });

  it("falls back to draft from list when stored id fails", async () => {
    vi.mocked(session.getStoredGesprekId).mockReturnValue("bad-id");
    vi.mocked(client.fetchGesprek)
      .mockRejectedValueOnce(new Error("not found"))
      .mockResolvedValueOnce({
        id: "draft-id",
        state: mockState,
      } as Awaited<ReturnType<typeof client.fetchGesprek>>);
    vi.mocked(client.fetchGesprekkenList).mockResolvedValue([
      {
        id: "draft-id",
        status: "draft",
        medewerkerNaam: "",
        medewerkerEmail: null,
        gesprekDatum: null,
        hoofdbeoordelaar: "",
        updatedAt: "",
      },
    ]);

    const result = await loadActiveGesprek();
    expect(result.id).toBe("draft-id");
  });

  it("creates new gesprek when list is empty", async () => {
    vi.mocked(session.getStoredGesprekId).mockReturnValue(null);
    vi.mocked(client.fetchGesprekkenList).mockResolvedValue([]);
    vi.mocked(client.createGesprek).mockResolvedValue({
      id: "new-id",
      state: mockState,
    } as Awaited<ReturnType<typeof client.createGesprek>>);

    const result = await loadActiveGesprek();
    expect(result.id).toBe("new-id");
    expect(client.createGesprek).toHaveBeenCalled();
  });
});
