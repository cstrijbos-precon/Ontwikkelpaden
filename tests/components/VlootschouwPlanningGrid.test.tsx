import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VlootschouwPlanningGrid } from "@/components/organisms/VlootschouwPlanningGrid";
import type { RolRij } from "@/lib/vlootschouw/types";

function rij(overrides: Partial<RolRij>): RolRij {
  return {
    padId: "vakexpert",
    niveau: 1,
    rolNaam: "Consultant",
    wereld: "QA",
    aanwezig: 0,
    nodigNu: 0,
    nodigStraks: 0,
    ...overrides,
  };
}

const ROLLEN: RolRij[] = [
  rij({ wereld: "QA", aanwezig: 3, nodigNu: 5, nodigStraks: 6 }),
  rij({ wereld: "RA", aanwezig: 2, nodigNu: 1, nodigStraks: 2 }),
];

describe("VlootschouwPlanningGrid", () => {
  it("laat bij 'totaal' de optelsom zien en geeft geen invoervelden", () => {
    render(
      <VlootschouwPlanningGrid
        rollen={ROLLEN}
        wereldFilter="totaal"
        onWijzig={vi.fn()}
      />,
    );

    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);
    // 3 + 2 aanwezig, 5 + 1 nu nodig, 6 + 2 straks nodig.
    const totaal = screen.getByTestId("totaal-vakexpert");
    expect(within(totaal).getByText("5")).toBeInTheDocument();
    expect(within(totaal).getByText("6")).toBeInTheDocument();
    expect(within(totaal).getByText("8")).toBeInTheDocument();
  });

  it("toont de cijfers van alleen de gekozen wereld, in invulbare velden", () => {
    render(
      <VlootschouwPlanningGrid
        rollen={ROLLEN}
        wereldFilter="RA"
        onWijzig={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Vakexpert niveau 1, nu nodig")).toHaveValue(
      1,
    );
    expect(
      screen.getByLabelText("Vakexpert niveau 1, straks nodig"),
    ).toHaveValue(2);
    // Vier paden × vijf niveaus × twee velden.
    expect(screen.getAllByRole("spinbutton")).toHaveLength(40);
  });

  it("slaat een nieuw 'nu nodig' op voor de gekozen wereld, en houdt 'straks nodig' vast", () => {
    const onWijzig = vi.fn();
    render(
      <VlootschouwPlanningGrid
        rollen={ROLLEN}
        wereldFilter="RA"
        onWijzig={onWijzig}
      />,
    );

    const veld = screen.getByLabelText("Vakexpert niveau 1, nu nodig");
    fireEvent.change(veld, { target: { value: "4" } });
    fireEvent.blur(veld);

    expect(onWijzig).toHaveBeenCalledWith({
      padId: "vakexpert",
      niveau: 1,
      wereld: "RA",
      nodigNu: 4,
      nodigStraks: 2,
    });
  });

  it("slaat een nieuw 'straks nodig' op en houdt 'nu nodig' vast", () => {
    const onWijzig = vi.fn();
    render(
      <VlootschouwPlanningGrid
        rollen={ROLLEN}
        wereldFilter="QA"
        onWijzig={onWijzig}
      />,
    );

    const veld = screen.getByLabelText("Vakexpert niveau 1, straks nodig");
    fireEvent.change(veld, { target: { value: "9" } });
    fireEvent.blur(veld);

    expect(onWijzig).toHaveBeenCalledWith({
      padId: "vakexpert",
      niveau: 1,
      wereld: "QA",
      nodigNu: 5,
      nodigStraks: 9,
    });
  });

  it("bewaart niets als de waarde niet verandert of ongeldig is", () => {
    const onWijzig = vi.fn();
    render(
      <VlootschouwPlanningGrid
        rollen={ROLLEN}
        wereldFilter="QA"
        onWijzig={onWijzig}
      />,
    );

    const veld = screen.getByLabelText("Vakexpert niveau 1, nu nodig");
    fireEvent.blur(veld); // ongewijzigd
    fireEvent.change(veld, { target: { value: "-3" } });
    fireEvent.blur(veld);

    expect(onWijzig).not.toHaveBeenCalled();
    expect(veld).toHaveValue(5); // teruggezet
  });

  it("meldt een tekort bij te weinig mensen en een overschot bij te veel", () => {
    render(
      <VlootschouwPlanningGrid
        rollen={[
          ...ROLLEN,
          rij({
            padId: "leider",
            niveau: 2,
            wereld: "QA",
            aanwezig: 1,
            nodigNu: 4,
          }),
          rij({
            padId: "trainer",
            niveau: 3,
            wereld: "QA",
            aanwezig: 5,
            nodigNu: 2,
          }),
        ]}
        wereldFilter="QA"
        onWijzig={vi.fn()}
      />,
    );

    // Eén positie per pad met gegevens: de status staat in de cel én in het
    // padtotaal, dus elk twee keer.
    expect(screen.getAllByText("3 tekort")).toHaveLength(2);
    expect(screen.getAllByText("3 over")).toHaveLength(2);
  });

  it("toont geen status voor een positie zonder norm", () => {
    render(
      <VlootschouwPlanningGrid
        rollen={[rij({ aanwezig: 4, nodigNu: 0 })]}
        wereldFilter="QA"
        onWijzig={vi.fn()}
      />,
    );

    expect(screen.queryByText(/tekort|over|op sterkte/)).toBeNull();
  });
});
