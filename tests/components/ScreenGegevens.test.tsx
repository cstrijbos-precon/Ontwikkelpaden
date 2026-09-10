import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScreenGegevens } from "@/components/organisms/screens/ScreenGegevens";
import { createInitialState } from "@/lib/initial-state";

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { email: "jan@precon.nl", isAdmin: false } },
  }),
}));

function props(overrides: Partial<Parameters<typeof ScreenGegevens>[0]> = {}) {
  return {
    state: createInitialState(),
    importWarnings: [],
    medewerkerEmail: "jan@precon.nl",
    knownEmails: [],
    onUpdate: vi.fn(),
    onImportDocx: vi.fn(),
    onDismissImportWarnings: vi.fn(),
    onSetMedewerkerEmail: vi.fn(),
    ...overrides,
  };
}

describe("ScreenGegevens — hoofd-/medebeoordelaarveld", () => {
  it("waarschuwt als het veld een naam bevat in plaats van een e-mailadres", () => {
    const state = createInitialState();
    state.hoofdbeoordelaar = "Chantal Strijbos";
    render(<ScreenGegevens {...props({ state })} />);

    expect(screen.getByText(/Dit lijkt geen e-mailadres/)).toBeInTheDocument();
  });

  it("toont geen waarschuwing bij een leeg veld", () => {
    render(<ScreenGegevens {...props()} />);
    expect(
      screen.queryByText(/Dit lijkt geen e-mailadres/),
    ).not.toBeInTheDocument();
  });

  it("toont de 'geen account'-waarschuwing, niet de naam-waarschuwing, bij een onbekend maar geldig e-mailadres", () => {
    const state = createInitialState();
    state.hoofdbeoordelaar = "onbekend@precongroup.com";
    render(<ScreenGegevens {...props({ state, knownEmails: [] })} />);

    expect(
      screen.queryByText(/Dit lijkt geen e-mailadres/),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Geen account gevonden/)).toBeInTheDocument();
  });

  it("toont geen waarschuwing bij een bekend, geldig e-mailadres", () => {
    const state = createInitialState();
    state.medebeoordelaar = "kim@precongroup.com";
    render(
      <ScreenGegevens
        {...props({ state, knownEmails: ["kim@precongroup.com"] })}
      />,
    );

    expect(
      screen.queryByText(/Dit lijkt geen e-mailadres/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Geen account gevonden/)).not.toBeInTheDocument();
  });
});
