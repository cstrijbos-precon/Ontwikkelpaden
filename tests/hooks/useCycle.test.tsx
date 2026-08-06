import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCycle } from "@/hooks/useCycle";
import { createInitialState } from "@/lib/initial-state";
import type { GesprekStatus } from "@/types/gesprekken";

vi.mock("@/lib/gesprekken-session", () => ({
  setStoredGesprekId: vi.fn(),
}));

vi.mock("@/services/gesprekken-client", () => ({
  saveGesprek: vi.fn(),
  startNewCycle: vi.fn(),
}));

import { setStoredGesprekId } from "@/lib/gesprekken-session";
import { saveGesprek, startNewCycle } from "@/services/gesprekken-client";

function setup(gesprekId: string | null = "g-1") {
  return renderHook(() => {
    const [state, setState] = useState(createInitialState);
    const [status, setStatus] = useState<GesprekStatus>("draft");
    const [previousGesprekId, setPreviousGesprekId] = useState<string | null>(
      null,
    );
    const [huidig, setHuidig] = useState(3);
    const [saveStatus, setSaveStatus] = useState("");
    const [id, setGesprekId] = useState<string | null>(gesprekId);
    const [medewerkerEmail, setMedewerkerEmail] = useState<string | null>(null);

    const cycle = useCycle({
      gesprekId: id,
      state,
      setState,
      setGesprekId,
      setStatus,
      setPreviousGesprekId,
      setMedewerkerEmail,
      setHuidig,
      setSaveStatus,
    });

    return {
      state,
      status,
      previousGesprekId,
      medewerkerEmail,
      huidig,
      saveStatus,
      ...cycle,
    };
  });
}

describe("useCycle", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("handleAfronden slaat op met status completed", async () => {
    vi.mocked(saveGesprek).mockResolvedValue(
      {} as Awaited<ReturnType<typeof saveGesprek>>,
    );
    const { result } = setup();

    await act(async () => {
      await result.current.handleAfronden();
    });

    expect(saveGesprek).toHaveBeenCalledWith(
      "g-1",
      expect.anything(),
      "completed",
    );
    expect(result.current.status).toBe("completed");
  });

  it("handleAfronden doet niets zonder gesprekId", async () => {
    const { result } = setup(null);

    await act(async () => {
      await result.current.handleAfronden();
    });

    expect(saveGesprek).not.toHaveBeenCalled();
  });

  it("handleStartNewCycle wisselt naar het nieuwe gesprek en gaat terug naar scherm 1", async () => {
    const nieuweState = createInitialState();
    nieuweState.naam = "Pien";
    vi.mocked(startNewCycle).mockResolvedValue({
      id: "g-2",
      state: nieuweState,
      status: "draft",
      previousGesprekId: "g-1",
      medewerkerEmail: "medewerker@precon.nl",
    } as Awaited<ReturnType<typeof startNewCycle>>);

    const { result } = setup();

    await act(async () => {
      await result.current.handleStartNewCycle();
    });

    expect(setStoredGesprekId).toHaveBeenCalledWith("g-2");
    expect(result.current.state.naam).toBe("Pien");
    expect(result.current.status).toBe("draft");
    expect(result.current.previousGesprekId).toBe("g-1");
    expect(result.current.medewerkerEmail).toBe("medewerker@precon.nl");
    expect(result.current.huidig).toBe(0);
  });
});
