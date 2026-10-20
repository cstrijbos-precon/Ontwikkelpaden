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

  it("toont per niveau het aandeel nu en het gewenste aandeel", () => {
    render(
      <VlootschouwPlanningGrid
        rollen={[
          rij({ niveau: 1, wereld: "RA", aanwezig: 0, nodigNu: 10 }),
          rij({ niveau: 2, wereld: "RA", aanwezig: 1, nodigNu: 30 }),
        ]}
        wereldFilter="RA"
        onWijzig={vi.fn()}
      />,
    );

    // Niveau 2 van Vakexpert: de ene ingeschaalde persoon zit hier (100%),
    // terwijl 30 van de 40 gewenste mensen (75%) hier hoort.
    const cel = screen
      .getByLabelText("Vakexpert niveau 2, nu nodig")
      .closest(".plan-cel") as HTMLElement;
    expect(within(cel).getByText("100%")).toBeInTheDocument();
    expect(within(cel).getByText("75%")).toBeInTheDocument();
    expect(within(cel).getByText("25 pp boven gewenst")).toBeInTheDocument();
  });

  it("meldt per niveau of het onder, op of boven de gewenste verdeling zit", () => {
    render(
      <VlootschouwPlanningGrid
        rollen={[
          rij({ niveau: 1, wereld: "RA", aanwezig: 1, nodigNu: 6 }),
          rij({ niveau: 2, wereld: "RA", aanwezig: 3, nodigNu: 4 }),
          rij({ niveau: 3, wereld: "RA", aanwezig: 6, nodigNu: 0 }),
        ]}
        wereldFilter="RA"
        onWijzig={vi.fn()}
      />,
    );

    // Aanwezig 10: 10% / 30% / 60%. Gewenst 10: 60% / 40% / 0%.
    expect(screen.getByText("50 pp onder gewenst")).toBeInTheDocument();
    expect(screen.getByText("10 pp onder gewenst")).toBeInTheDocument();
    expect(screen.getByText("60 pp boven gewenst")).toBeInTheDocument();
  });

  it("toont in het padtotaal hoeveel van de populatie is ingeschaald", () => {
    render(
      <VlootschouwPlanningGrid
        rollen={[
          rij({ niveau: 1, wereld: "RA", aanwezig: 0, nodigNu: 10 }),
          rij({ niveau: 2, wereld: "RA", aanwezig: 1, nodigNu: 30 }),
        ]}
        wereldFilter="RA"
        onWijzig={vi.fn()}
      />,
    );

    expect(
      within(screen.getByTestId("totaal-vakexpert")).getByText(
        "1 van 40 ingeschaald (3%)",
      ),
    ).toBeInTheDocument();
  });

  it("zegt dat er nog geen norm is als die ontbreekt", () => {
    render(
      <VlootschouwPlanningGrid
        rollen={[rij({ aanwezig: 2, nodigNu: 0 })]}
        wereldFilter="QA"
        onWijzig={vi.fn()}
      />,
    );

    expect(
      within(screen.getByTestId("totaal-vakexpert")).getByText(
        "Nog geen norm ingevuld",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/pp (onder|boven) gewenst/)).toBeNull();
  });

  it("toont geen verschil als nog niemand is ingeschaald", () => {
    render(
      <VlootschouwPlanningGrid
        rollen={[rij({ aanwezig: 0, nodigNu: 5 })]}
        wereldFilter="QA"
        onWijzig={vi.fn()}
      />,
    );

    expect(screen.queryByText(/pp (onder|boven) gewenst|op niveau/)).toBeNull();
  });

  it("meldt niets bij een niveau waar niemand zit en niemand hoort te zitten", () => {
    render(
      <VlootschouwPlanningGrid
        rollen={[
          rij({ niveau: 1, wereld: "RA", aanwezig: 2, nodigNu: 4 }),
          rij({ niveau: 2, wereld: "RA", aanwezig: 0, nodigNu: 0 }),
        ]}
        wereldFilter="RA"
        onWijzig={vi.fn()}
      />,
    );

    const leeg = screen
      .getByLabelText("Vakexpert niveau 2, nu nodig")
      .closest(".plan-cel") as HTMLElement;
    expect(within(leeg).queryByText(/op niveau|pp (onder|boven)/)).toBeNull();
    // Een niveau mét gegevens meldt het wel.
    const gevuld = screen
      .getByLabelText("Vakexpert niveau 1, nu nodig")
      .closest(".plan-cel") as HTMLElement;
    expect(within(gevuld).getByText("op niveau")).toBeInTheDocument();
  });
});
