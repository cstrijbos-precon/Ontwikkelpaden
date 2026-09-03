import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GoedkeuringPopup } from "@/components/organisms/GoedkeuringPopup";
import type { GesprekListItem } from "@/types/gesprekken";

const respondBeoordelaarKoppelingMock = vi.fn();
const respondHoofdbeoordelaarKoppelingMock = vi.fn();

vi.mock("@/services/gesprekken-client", () => ({
  respondBeoordelaarKoppeling: (...args: unknown[]) =>
    respondBeoordelaarKoppelingMock(...args),
  respondHoofdbeoordelaarKoppeling: (...args: unknown[]) =>
    respondHoofdbeoordelaarKoppelingMock(...args),
}));

function medebeoordelaarItem(
  overrides: Partial<GesprekListItem> = {},
): GesprekListItem {
  return {
    id: "gesprek-1",
    medewerkerNaam: "Jan",
    medewerkerEmail: "jan@precon.nl",
    gesprekDatum: "2026-01-01",
    status: "draft",
    hoofdbeoordelaar: "",
    hoofdbeoordelaarStatus: "toegestaan",
    medebeoordelaar: "mede@precon.nl",
    medebeoordelaarStatus: "in_afwachting",
    updatedAt: "2026-01-01",
    ...overrides,
  };
}

beforeEach(() => {
  respondBeoordelaarKoppelingMock.mockReset().mockResolvedValue({});
  respondHoofdbeoordelaarKoppelingMock.mockReset().mockResolvedValue(undefined);
});

describe("GoedkeuringPopup", () => {
  it("toont niets zonder openstaande verzoeken", () => {
    const { container } = render(
      <GoedkeuringPopup items={[]} onResolved={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("toont de doorlopende vraag met 'al jouw' in de tekst", () => {
    render(
      <GoedkeuringPopup
        items={[]}
        pendingHoofdbeoordelaar="kim@precon.nl"
        onResolved={vi.fn()}
      />,
    );
    expect(screen.getByText("kim@precon.nl")).toBeInTheDocument();
    expect(
      screen.getByText(/al jouw functioneringsgesprekken/),
    ).toBeInTheDocument();
  });

  it("goedkeuren van de doorlopende vraag roept de juiste service aan, niet de gesprek-route", async () => {
    const onResolved = vi.fn();
    render(
      <GoedkeuringPopup
        items={[]}
        pendingHoofdbeoordelaar="kim@precon.nl"
        onResolved={onResolved}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Goedkeuren" }));

    await vi.waitFor(() => expect(onResolved).toHaveBeenCalled());
    expect(respondHoofdbeoordelaarKoppelingMock).toHaveBeenCalledWith(
      "goedkeuren",
    );
    expect(respondBeoordelaarKoppelingMock).not.toHaveBeenCalled();
  });

  it("toont de medebeoordelaar-vraag beperkt tot het huidige verslag", () => {
    render(
      <GoedkeuringPopup items={[medebeoordelaarItem()]} onResolved={vi.fn()} />,
    );
    expect(screen.getByText("mede@precon.nl")).toBeInTheDocument();
    expect(
      screen.getByText(/jouw huidige functioneringsgesprek/),
    ).toBeInTheDocument();
  });

  it("afwijzen van een medebeoordelaar-verzoek roept de gesprek-route aan met het juiste id", async () => {
    const onResolved = vi.fn();
    render(
      <GoedkeuringPopup
        items={[medebeoordelaarItem({ id: "gesprek-42" })]}
        onResolved={onResolved}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Afwijzen" }));

    await vi.waitFor(() => expect(onResolved).toHaveBeenCalled());
    expect(respondBeoordelaarKoppelingMock).toHaveBeenCalledWith(
      "gesprek-42",
      "medebeoordelaar",
      "afwijzen",
    );
  });

  it("toont beide kaarten tegelijk als er zowel een doorlopende als een medebeoordelaar-vraag openstaat", () => {
    render(
      <GoedkeuringPopup
        items={[medebeoordelaarItem()]}
        pendingHoofdbeoordelaar="kim@precon.nl"
        onResolved={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("button", { name: "Goedkeuren" })).toHaveLength(
      2,
    );
  });
});
