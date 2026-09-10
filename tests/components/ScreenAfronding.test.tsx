import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScreenAfronding } from "@/components/organisms/screens/ScreenAfronding";
import { createInitialState } from "@/lib/initial-state";

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { email: "jan@precon.nl", isAdmin: false } },
  }),
}));

describe("ScreenAfronding", () => {
  it("legt uit waarom afronden nog niet kan als niet iedereen heeft getekend", () => {
    render(
      <ScreenAfronding
        state={createInitialState()}
        status="draft"
        medewerkerEmail="jan@precon.nl"
        onUpdate={vi.fn()}
        onAfronden={vi.fn()}
      />,
    );

    const knop = screen.getByRole("button", { name: "Gesprek afronden" });
    expect(knop).toBeDisabled();
    expect(
      screen.getByText(/pas als alle drie de handtekeningen/),
    ).toBeInTheDocument();
  });

  it("toont de uitleg niet meer zodra iedereen heeft getekend", () => {
    const state = createInitialState();
    state.akkoordProfessional = true;
    state.akkoordHoofdbeoordelaar = true;
    state.akkoordMedebeoordelaar = true;

    render(
      <ScreenAfronding
        state={state}
        status="draft"
        medewerkerEmail="jan@precon.nl"
        onUpdate={vi.fn()}
        onAfronden={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Gesprek afronden" }),
    ).toBeEnabled();
    expect(
      screen.queryByText(/pas als alle drie de handtekeningen/),
    ).not.toBeInTheDocument();
  });

  it("toont geen uitleg meer als het gesprek al is afgerond", () => {
    render(
      <ScreenAfronding
        state={createInitialState()}
        status="completed"
        medewerkerEmail="jan@precon.nl"
        onUpdate={vi.fn()}
        onAfronden={vi.fn()}
      />,
    );

    expect(
      screen.queryByText(/pas als alle drie de handtekeningen/),
    ).not.toBeInTheDocument();
  });
});
