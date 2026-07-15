import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { useReflecties } from "@/hooks/useReflecties";
import { createInitialState } from "@/lib/initial-state";

function setup() {
  return renderHook(() => {
    const [state, setState] = useState(createInitialState);
    const handlers = useReflecties(setState);
    return { state, ...handlers };
  });
}

describe("useReflecties", () => {
  it("addReflectie voegt een nieuwe lege reflectie toe met vandaag als datum", () => {
    const { result } = setup();

    act(() => {
      result.current.addReflectie();
    });

    expect(result.current.state.reflecties).toHaveLength(1);
    const reflectie = result.current.state.reflecties[0];
    expect(reflectie?.tekst).toBe("");
    expect(reflectie?.datum).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("updateReflectie past alleen de opgegeven velden aan", () => {
    const { result } = setup();

    act(() => {
      result.current.addReflectie();
    });
    const id = result.current.state.reflecties[0]?.id as string;

    act(() => {
      result.current.updateReflectie(id, { tekst: "Goed gesprek gehad" });
    });

    expect(result.current.state.reflecties[0]?.tekst).toBe(
      "Goed gesprek gehad",
    );
  });

  it("removeReflectie verwijdert de juiste reflectie", () => {
    const { result } = setup();

    act(() => {
      result.current.addReflectie();
      result.current.addReflectie();
    });
    const [first, second] = result.current.state.reflecties;

    act(() => {
      result.current.removeReflectie(first?.id as string);
    });

    expect(result.current.state.reflecties).toHaveLength(1);
    expect(result.current.state.reflecties[0]?.id).toBe(second?.id);
  });
});
