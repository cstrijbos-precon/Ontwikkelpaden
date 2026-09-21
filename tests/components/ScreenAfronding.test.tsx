import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScreenAfronding } from "@/components/organisms/screens/ScreenAfronding";
import { createInitialState } from "@/lib/initial-state";

const exportWordMock = vi.fn();

vi.mock("@/lib/export-word", () => ({
  exportWord: (...args: unknown[]) => exportWordMock(...args),
}));

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

  it("downloadt het verslag via de knop bij Doorsturen naar HR", () => {
    const state = createInitialState();
    state.naam = "Sofie";
    render(
      <ScreenAfronding
        state={state}
        status="completed"
        medewerkerEmail="jan@precon.nl"
        onUpdate={vi.fn()}
        onAfronden={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Download ondertekend verslag/ }),
    );
    expect(exportWordMock).toHaveBeenCalledWith(state);
  });

  it("opent een mail naar HR met de naam van de professional in het onderwerp", () => {
    const state = createInitialState();
    state.naam = "Sofie Nackaerts";
    render(
      <ScreenAfronding
        state={state}
        status="completed"
        medewerkerEmail="jan@precon.nl"
        onUpdate={vi.fn()}
        onAfronden={vi.fn()}
      />,
    );

    const href = screen
      .getByRole("link", { name: /Mail naar HR/ })
      .getAttribute("href") as string;
    expect(href.startsWith("mailto:hr@precongroup.com?")).toBe(true);
    expect(decodeURIComponent(href)).toContain("Sofie Nackaerts");
  });
});
