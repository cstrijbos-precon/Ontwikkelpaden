import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SenioriteitBlok } from "@/components/organisms/SenioriteitBlok";
import { createInitialState } from "@/lib/initial-state";
import type { OntwikkelpadenState } from "@/types/ontwikkelpaden";

function stateMet(overrides: Partial<OntwikkelpadenState>) {
  return { ...createInitialState(), ...overrides };
}

describe("SenioriteitBlok", () => {
  it("suggereert junior zolang er niets is behaald", () => {
    render(<SenioriteitBlok state={createInitialState()} onUpdate={vi.fn()} />);
    expect(screen.getByText("Junior")).toBeInTheDocument();
  });

  it("suggereert senior bij twee paden op niveau 3", () => {
    const state = stateMet({
      niveauCorrectie: {
        vakexpert: 3,
        adviseur: 3,
        leider: null,
        trainer: null,
      },
    });
    render(<SenioriteitBlok state={state} onUpdate={vi.fn()} />);
    expect(screen.getByText("Senior")).toBeInTheDocument();
    expect(
      screen.getByText(/Op 2 ontwikkelpaden niveau 3 bereikt/),
    ).toBeInTheDocument();
  });

  it("meldt het T-profiel apart en rekent het niet mee", () => {
    const state = stateMet({ tDiepte: "Aanbestedingsrecht" });
    render(<SenioriteitBlok state={state} onUpdate={vi.fn()} />);
    expect(screen.getByText("Junior")).toBeInTheDocument();
    expect(
      screen.getByText(/T-profiel: diep ingevuld.*telt niet mee/s),
    ).toBeInTheDocument();
  });

  it("neemt de suggestie over in het invulveld", () => {
    const onUpdate = vi.fn();
    const state = stateMet({
      niveauCorrectie: {
        vakexpert: 2,
        adviseur: 2,
        leider: null,
        trainer: null,
      },
    });
    render(<SenioriteitBlok state={state} onUpdate={onUpdate} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Neem suggestie over/ }),
    );
    expect(onUpdate).toHaveBeenCalledWith("Medior");
  });

  it("opent de uitleg uit de ontwikkelpadengids", () => {
    render(<SenioriteitBlok state={createInitialState()} onUpdate={vi.fn()} />);
    expect(screen.queryByRole("heading", { name: "Medior" })).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /Uitleg uit de ontwikkelpadengids/ }),
    );

    expect(
      screen.getByRole("heading", { name: "Junior, medior, senior" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Op 2 van de ontwikkelpaden niveau 2 bereikt/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/niet altijd direct te linken aan/),
    ).toBeInTheDocument();
  });
});
