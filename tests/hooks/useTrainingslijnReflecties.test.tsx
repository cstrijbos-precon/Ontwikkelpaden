import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { useTrainingslijnReflecties } from "@/hooks/useTrainingslijnReflecties";
import { createInitialState } from "@/lib/initial-state";

function setup() {
  return renderHook(() => {
    const [state, setState] = useState(createInitialState);
    const handlers = useTrainingslijnReflecties(setState);
    return { state, ...handlers };
  });
}

describe("useTrainingslijnReflecties", () => {
  it("toggleGevolgdeTrainingslijn voegt een lijn toe en weer eraf", () => {
    const { result } = setup();

    act(() => {
      result.current.toggleGevolgdeTrainingslijn("Adviseur 1-2");
    });
    expect(result.current.state.gevolgdeTrainingslijnen).toEqual([
      "Adviseur 1-2",
    ]);

    act(() => {
      result.current.toggleGevolgdeTrainingslijn("Adviseur 1-2");
    });
    expect(result.current.state.gevolgdeTrainingslijnen).toEqual([]);
  });

  it("bewaart eerder ingevulde reflecties als een lijn wordt uitgevinkt", () => {
    const { result } = setup();

    act(() => {
      result.current.toggleGevolgdeTrainingslijn("Adviseur 1-2");
      result.current.updateTrainingslijnReflectie("Adviseur 1-2", "Dagdeel 1", {
        inzichten: "Veel geleerd",
      });
    });

    act(() => {
      result.current.toggleGevolgdeTrainingslijn("Adviseur 1-2");
    });

    expect(result.current.state.gevolgdeTrainingslijnen).toEqual([]);
    expect(result.current.state.trainingslijnReflecties).toHaveLength(1);
    expect(result.current.state.trainingslijnReflecties[0]?.inzichten).toBe(
      "Veel geleerd",
    );
  });

  it("maakt een nieuwe reflectie aan voor een onbekende combinatie van lijn en dagdeel", () => {
    const { result } = setup();

    act(() => {
      result.current.updateTrainingslijnReflectie(
        "Vakexpert 1-2",
        "Dagdeel 2",
        {
          leerpunten: "Beter vragen stellen",
        },
      );
    });

    expect(result.current.state.trainingslijnReflecties).toEqual([
      {
        lijn: "Vakexpert 1-2",
        dagdeel: "Dagdeel 2",
        inzichten: "",
        leerpunten: "Beter vragen stellen",
      },
    ]);
  });

  it("werkt een bestaande reflectie bij zonder het andere veld te wissen", () => {
    const { result } = setup();

    act(() => {
      result.current.updateTrainingslijnReflectie("Leider 1-2", "Dagdeel 1", {
        inzichten: "Inzicht A",
      });
    });
    act(() => {
      result.current.updateTrainingslijnReflectie("Leider 1-2", "Dagdeel 1", {
        leerpunten: "Leerpunt B",
      });
    });

    expect(result.current.state.trainingslijnReflecties).toEqual([
      {
        lijn: "Leider 1-2",
        dagdeel: "Dagdeel 1",
        inzichten: "Inzicht A",
        leerpunten: "Leerpunt B",
      },
    ]);
  });

  it("houdt reflecties van verschillende dagdelen apart", () => {
    const { result } = setup();

    act(() => {
      result.current.updateTrainingslijnReflectie("Leider 1-2", "Dagdeel 1", {
        inzichten: "Eerste",
      });
      result.current.updateTrainingslijnReflectie("Leider 1-2", "Dagdeel 2", {
        inzichten: "Tweede",
      });
    });

    expect(result.current.state.trainingslijnReflecties).toHaveLength(2);
  });
});
