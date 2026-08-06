import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NiveauCorrectieBlok } from "@/components/organisms/NiveauCorrectieBlok";
import { createInitialState } from "@/lib/initial-state";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

function stateMetCorrectie(toelichting = ""): OntwikkelpadenState {
  const state = createInitialState();
  state.scores = { b: 1, k: 1, o: 1, org: 1, t: 0 };
  state.niveauCorrectie.vakexpert = 4;
  state.niveauCorrectieToelichting = toelichting;
  return state;
}

describe("NiveauCorrectieBlok", () => {
  it("blijft onzichtbaar zolang er niets is verschoven", () => {
    const { container } = render(
      <NiveauCorrectieBlok
        state={createInitialState()}
        onHerstel={vi.fn()}
        onToelichting={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("toont het berekende en het gekozen niveau", () => {
    render(
      <NiveauCorrectieBlok
        state={stateMetCorrectie()}
        onHerstel={vi.fn()}
        onToelichting={vi.fn()}
      />,
    );
    expect(screen.getByText("Vakexpert")).toBeInTheDocument();
    expect(screen.getByText(/berekend niveau 1/)).toBeInTheDocument();
    expect(screen.getByText(/niveau 4/)).toBeInTheDocument();
  });

  it("dringt aan op een toelichting zolang die ontbreekt", () => {
    render(
      <NiveauCorrectieBlok
        state={stateMetCorrectie()}
        onHerstel={vi.fn()}
        onToelichting={vi.fn()}
      />,
    );
    expect(screen.getByText(/Vul een toelichting in/)).toBeInTheDocument();
  });

  it("laat de waarschuwing los zodra er een toelichting staat", () => {
    render(
      <NiveauCorrectieBlok
        state={stateMetCorrectie("Ervaring van vorige werkgever.")}
        onHerstel={vi.fn()}
        onToelichting={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Vul een toelichting in/)).toBeNull();
  });

  it("herstelt de berekening voor het juiste pad", () => {
    const onHerstel = vi.fn();
    render(
      <NiveauCorrectieBlok
        state={stateMetCorrectie()}
        onHerstel={onHerstel}
        onToelichting={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Herstel berekening" }));
    expect(onHerstel).toHaveBeenCalledWith("vakexpert");
  });

  it("geeft getypte toelichting door", () => {
    const onToelichting = vi.fn();
    render(
      <NiveauCorrectieBlok
        state={stateMetCorrectie()}
        onHerstel={vi.fn()}
        onToelichting={onToelichting}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Toelichting op de aanpassing/), {
      target: { value: "Zeven jaar ervaring elders." },
    });
    expect(onToelichting).toHaveBeenCalledWith("Zeven jaar ervaring elders.");
  });
});
