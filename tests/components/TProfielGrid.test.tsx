import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TProfielGrid } from "@/components/organisms/TProfielGrid";
import { createInitialState } from "@/lib/initial-state";

describe("TProfielGrid", () => {
  it("heeft een oneven aantal kolommen, zodat de staande poot precies in het midden kan staan", () => {
    const { container } = render(
      <TProfielGrid state={createInitialState()} onToggle={vi.fn()} />,
    );
    const cellen = container.querySelectorAll(".t-cel");
    const kolommen = 9;
    expect(kolommen % 2).toBe(1);
    expect(cellen).toHaveLength(6 * kolommen);
  });

  it("roept onToggle aan met de juiste rij en kolom", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <TProfielGrid state={createInitialState()} onToggle={onToggle} />,
    );
    const cellen = container.querySelectorAll(".t-cel");
    // Cel op index 4 in een rij van 9 is de vierde kolom (0-3), dus r=0,k=4.
    fireEvent.click(cellen[4] as HTMLElement);
    expect(onToggle).toHaveBeenCalledWith(0, 4);
  });
});
