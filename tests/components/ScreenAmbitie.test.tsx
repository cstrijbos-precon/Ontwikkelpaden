import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScreenAmbitie } from "@/components/organisms/screens/ScreenAmbitie";
import { createInitialState } from "@/lib/initial-state";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

/** Scores waarmee elk pad op zijn hoogste niveau (5) uitkomt. */
function stateOpHoogsteNiveau(): OntwikkelpadenState {
  const state = createInitialState();
  state.niveauCorrectie = {
    vakexpert: 5,
    adviseur: 5,
    leider: 5,
    trainer: 5,
  };
  return state;
}

function renderScherm(state: OntwikkelpadenState) {
  const onSetTrainingsgroep = vi.fn();
  render(
    <ScreenAmbitie
      state={state}
      onUpdate={vi.fn()}
      onToggleAmbitie={vi.fn()}
      onSetTrainingsgroep={onSetTrainingsgroep}
    />,
  );
  return { onSetTrainingsgroep };
}

describe("ScreenAmbitie", () => {
  it("toont voor elk pad een trainingsgroep, ook zonder ambitie", () => {
    renderScherm(createInitialState());
    expect(screen.getAllByText("Trainingsgroep")).toHaveLength(4);
  });

  it("laat de trainingsgroep kiezen op het hoogste niveau", () => {
    const state = stateOpHoogsteNiveau();
    const { onSetTrainingsgroep } = renderScherm(state);

    // Het hoogste niveau is bereikt, dus er is geen ambitie meer mogelijk...
    expect(screen.getAllByText("✓ Hoogste niveau bereikt!")).toHaveLength(4);

    // ...maar de trainingsgroepen blijven vrij te kiezen.
    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(4);
    const eerste = selects[0];
    if (!eerste) throw new Error("geen trainingsgroep-select gevonden");

    fireEvent.change(eerste, { target: { value: "vakexpert-1-2" } });
    expect(onSetTrainingsgroep).toHaveBeenCalledWith(
      "vakexpert",
      "vakexpert-1-2",
    );
  });

  it("volgt een handmatig verschoven niveau in plaats van de berekening", () => {
    const state = createInitialState();
    state.niveauCorrectie.leider = 2;
    renderScherm(state);

    expect(screen.getByText(/Niveau 2 –/)).toBeInTheDocument();
  });
});
