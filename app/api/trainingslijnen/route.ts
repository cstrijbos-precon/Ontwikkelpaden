import { auth } from "@/auth";

const NAVIGATOR_URL = "https://trainingslijnen-navigator.vercel.app/api/data";

interface NavigatorBlock {
  kind: string;
  label?: string;
  date?: string;
}

interface NavigatorLijn {
  kind?: string;
  blocks?: NavigatorBlock[];
}

export interface TrainingslijnDagdeel {
  label: string;
  datum: string;
}

export interface Trainingslijn {
  naam: string;
  dagdelen: TrainingslijnDagdeel[];
}

/** Het label komt soms met een handmatige regelafbreking uit de navigator. */
function schoonLabel(label: string): string {
  return label.replace(/\s+/g, " ").trim();
}

/**
 * Kickstart en Starterklas zijn terugkerende programma's zonder dagdelen —
 * die passen niet in "per dagdeel reflecteren" en blijven dus buiten deze
 * lijst.
 */
function naarTrainingslijnen(
  data: Record<string, NavigatorLijn>,
): Trainingslijn[] {
  return Object.entries(data)
    .filter(([, lijn]) => lijn.kind !== "recurring" && lijn.blocks)
    .map(([naam, lijn]) => ({
      naam,
      dagdelen: (lijn.blocks ?? [])
        .filter((b) => b.kind === "dagdeel" && b.label)
        .map((b) => ({
          label: schoonLabel(b.label ?? ""),
          datum: (b.date ?? "").trim(),
        })),
    }))
    .filter((lijn) => lijn.dagdelen.length > 0);
}

/**
 * Haalt live op welke trainingslijnen er zijn en welke dagdelen daarbij
 * horen, rechtstreeks van de trainingslijnen-navigator — dezelfde inhoud die
 * daar te zien is, dus geen kopie die uit de pas kan gaan lopen.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(NAVIGATOR_URL, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`navigator antwoordde met ${res.status}`);

    const body = (await res.json()) as { data?: Record<string, NavigatorLijn> };
    const lijnen = naarTrainingslijnen(body.data ?? {});
    return Response.json({ lijnen });
  } catch {
    return Response.json(
      {
        error:
          "Kon de trainingslijnen niet ophalen. Probeer het later opnieuw.",
      },
      { status: 502 },
    );
  }
}
