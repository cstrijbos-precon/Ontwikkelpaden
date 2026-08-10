import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useNiveauSleep } from "@/hooks/useNiveauSleep";

/** Een kolom van 550px: vijf niveaus van 110px, niveau 5 bovenaan. */
const BAAN_TOP = 100;
const BAAN_HOOGTE = 550;

function maakBaan(): HTMLDivElement {
  const el = document.createElement("div");
  el.getBoundingClientRect = () =>
    ({
      top: BAAN_TOP,
      height: BAAN_HOOGTE,
      bottom: BAAN_TOP + BAAN_HOOGTE,
      left: 0,
      right: 60,
      width: 60,
      x: 0,
      y: BAAN_TOP,
      toJSON: () => ({}),
    }) as DOMRect;
  return el;
}

// jsdom kent PointerEvent niet; MouseEvent draagt dezelfde clientY en de
// listeners luisteren puur op het gebeurtenistype.
function sleepNaar(clientY: number) {
  window.dispatchEvent(new MouseEvent("pointermove", { clientY }));
}

function laatLos() {
  window.dispatchEvent(new MouseEvent("pointerup"));
}

function setup() {
  const onZet = vi.fn();
  const hook = renderHook(() => useNiveauSleep(onZet));
  act(() => {
    hook.result.current.registreerBaan("vakexpert")(maakBaan());
  });
  return { onZet, hook };
}

function startSleep(
  hook: ReturnType<typeof setup>["hook"],
  vanafNiveau: number,
) {
  act(() => {
    hook.result.current.startSleep(
      "vakexpert",
      vanafNiveau,
    )({ preventDefault: () => {} } as React.PointerEvent);
  });
}

describe("useNiveauSleep", () => {
  it("landt op een heel niveau, ook midden tussen twee vakken", () => {
    const { onZet, hook } = setup();
    startSleep(hook, 1);

    // 260px onder de top valt in het derde vak van boven → niveau 3.
    act(() => sleepNaar(BAAN_TOP + 260));
    act(() => laatLos());

    expect(onZet).toHaveBeenCalledWith("vakexpert", 3);
    expect(Number.isInteger(onZet.mock.calls[0]?.[1])).toBe(true);
  });

  it("zet niveau 5 bovenaan en niveau 1 onderaan", () => {
    const { onZet, hook } = setup();

    startSleep(hook, 1);
    act(() => sleepNaar(BAAN_TOP + 5));
    act(() => laatLos());
    expect(onZet).toHaveBeenLastCalledWith("vakexpert", 5);

    startSleep(hook, 5);
    act(() => sleepNaar(BAAN_TOP + BAAN_HOOGTE - 5));
    act(() => laatLos());
    expect(onZet).toHaveBeenLastCalledWith("vakexpert", 1);
  });

  it("begrenst slepen buiten de kolom tot het hoogste en laagste niveau", () => {
    const { onZet, hook } = setup();

    startSleep(hook, 3);
    act(() => sleepNaar(BAAN_TOP - 400));
    act(() => laatLos());
    expect(onZet).toHaveBeenLastCalledWith("vakexpert", 5);

    startSleep(hook, 3);
    act(() => sleepNaar(BAAN_TOP + BAAN_HOOGTE + 400));
    act(() => laatLos());
    expect(onZet).toHaveBeenLastCalledWith("vakexpert", 1);
  });

  it("houdt tijdens het slepen bij waar het bolletje zou landen", () => {
    const { hook } = setup();
    expect(hook.result.current.sleep).toBeNull();

    startSleep(hook, 1);
    act(() => sleepNaar(BAAN_TOP + 150));
    expect(hook.result.current.sleep).toEqual({
      padId: "vakexpert",
      niveau: 4,
    });

    act(() => laatLos());
    expect(hook.result.current.sleep).toBeNull();
  });

  it("laat Escape het slepen afbreken zonder iets te wijzigen", () => {
    const { onZet, hook } = setup();
    startSleep(hook, 2);
    act(() => sleepNaar(BAAN_TOP + 5));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(hook.result.current.sleep).toBeNull();
    expect(onZet).not.toHaveBeenCalled();
  });
});
