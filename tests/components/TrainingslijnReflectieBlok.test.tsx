import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrainingslijnReflectieBlok } from "@/components/organisms/TrainingslijnReflectieBlok";

const fetchTrainingslijnenMock = vi.fn();

vi.mock("@/services/gesprekken-client", () => ({
  fetchTrainingslijnen: () => fetchTrainingslijnenMock(),
}));

const LIJNEN = [
  {
    naam: "Adviseur 1-2",
    dagdelen: [
      { label: "Dagdeel 1", datum: "september 2026" },
      { label: "Dagdeel 2", datum: "december 2026" },
    ],
  },
  { naam: "Vakexpert 1-2", dagdelen: [{ label: "Dagdeel 1", datum: "" }] },
];

beforeEach(() => {
  fetchTrainingslijnenMock.mockReset().mockResolvedValue(LIJNEN);
});

describe("TrainingslijnReflectieBlok", () => {
  it("toont een keuzelijst van lijnen die nog niet gevolgd worden", async () => {
    render(
      <TrainingslijnReflectieBlok
        gevolgdeTrainingslijnen={[]}
        trainingslijnReflecties={[]}
        onToggleLijn={vi.fn()}
        onUpdateReflectie={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Adviseur 1-2")).toBeInTheDocument(),
    );
    expect(screen.getByText("Vakexpert 1-2")).toBeInTheDocument();
  });

  it("kiezen van een lijn in de keuzelijst roept onToggleLijn aan", async () => {
    const onToggleLijn = vi.fn();
    render(
      <TrainingslijnReflectieBlok
        gevolgdeTrainingslijnen={[]}
        trainingslijnReflecties={[]}
        onToggleLijn={onToggleLijn}
        onUpdateReflectie={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("combobox")).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Adviseur 1-2" },
    });

    expect(onToggleLijn).toHaveBeenCalledWith("Adviseur 1-2");
  });

  it("toont per dagdeel de twee reflectievragen voor een gevolgde lijn", async () => {
    render(
      <TrainingslijnReflectieBlok
        gevolgdeTrainingslijnen={["Adviseur 1-2"]}
        trainingslijnReflecties={[]}
        onToggleLijn={vi.fn()}
        onUpdateReflectie={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getAllByText(/Welke inzichten heb je opgedaan/),
      ).toHaveLength(2),
    );
    expect(
      screen.getAllByText(/Met welke twee leerpunten ga je vanaf morgen/),
    ).toHaveLength(2);
  });

  it("laat eerder ingevulde tekst zien", async () => {
    render(
      <TrainingslijnReflectieBlok
        gevolgdeTrainingslijnen={["Adviseur 1-2"]}
        trainingslijnReflecties={[
          {
            lijn: "Adviseur 1-2",
            dagdeel: "Dagdeel 1",
            inzichten: "Ik heb geleerd om door te vragen",
            leerpunten: "",
          },
        ]}
        onToggleLijn={vi.fn()}
        onUpdateReflectie={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByDisplayValue("Ik heb geleerd om door te vragen"),
      ).toBeInTheDocument(),
    );
  });

  it("typen in een reflectieveld roept onUpdateReflectie aan met lijn en dagdeel", async () => {
    const onUpdateReflectie = vi.fn();
    render(
      <TrainingslijnReflectieBlok
        gevolgdeTrainingslijnen={["Vakexpert 1-2"]}
        trainingslijnReflecties={[]}
        onToggleLijn={vi.fn()}
        onUpdateReflectie={onUpdateReflectie}
      />,
    );

    await waitFor(() => expect(screen.getAllByRole("textbox")).toHaveLength(2));
    fireEvent.change(screen.getAllByRole("textbox")[0] as HTMLElement, {
      target: { value: "Nieuw inzicht" },
    });

    expect(onUpdateReflectie).toHaveBeenCalledWith(
      "Vakexpert 1-2",
      "Dagdeel 1",
      {
        inzichten: "Nieuw inzicht",
      },
    );
  });

  it("meldt het als een gevolgde lijn niet meer teruggevonden wordt", async () => {
    render(
      <TrainingslijnReflectieBlok
        gevolgdeTrainingslijnen={["Verdwenen lijn"]}
        trainingslijnReflecties={[]}
        onToggleLijn={vi.fn()}
        onUpdateReflectie={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(/kon de dagdelen.*niet.*vinden/i),
      ).toBeInTheDocument(),
    );
  });

  it("toont een foutmelding als ophalen mislukt", async () => {
    fetchTrainingslijnenMock.mockRejectedValue(new Error("Kon niet laden"));
    render(
      <TrainingslijnReflectieBlok
        gevolgdeTrainingslijnen={[]}
        trainingslijnReflecties={[]}
        onToggleLijn={vi.fn()}
        onUpdateReflectie={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Kon niet laden")).toBeInTheDocument(),
    );
  });
});
