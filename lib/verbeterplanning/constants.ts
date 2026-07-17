export interface MonthLabel {
  y: number;
  m: string;
}

/** Index 0-32 (33 maanden): april 2025 t/m december 2027. */
export const MONTHS: MonthLabel[] = [
  { y: 2025, m: "Apr" },
  { y: 2025, m: "Mei" },
  { y: 2025, m: "Jun" },
  { y: 2025, m: "Jul" },
  { y: 2025, m: "Aug" },
  { y: 2025, m: "Sep" },
  { y: 2025, m: "Okt" },
  { y: 2025, m: "Nov" },
  { y: 2025, m: "Dec" },
  { y: 2026, m: "Jan" },
  { y: 2026, m: "Feb" },
  { y: 2026, m: "Mrt" },
  { y: 2026, m: "Apr" },
  { y: 2026, m: "Mei" },
  { y: 2026, m: "Jun" },
  { y: 2026, m: "Jul" },
  { y: 2026, m: "Aug" },
  { y: 2026, m: "Sep" },
  { y: 2026, m: "Okt" },
  { y: 2026, m: "Nov" },
  { y: 2026, m: "Dec" },
  { y: 2027, m: "Jan" },
  { y: 2027, m: "Feb" },
  { y: 2027, m: "Mrt" },
  { y: 2027, m: "Apr" },
  { y: 2027, m: "Mei" },
  { y: 2027, m: "Jun" },
  { y: 2027, m: "Jul" },
  { y: 2027, m: "Aug" },
  { y: 2027, m: "Sep" },
  { y: 2027, m: "Okt" },
  { y: 2027, m: "Nov" },
  { y: 2027, m: "Dec" },
];

/** Index 0-7: vaste kwartalen voor KPI-tracking, vanaf Q1 2026. */
export const KPI_QUARTERS: string[] = [
  "Q1 2026",
  "Q2 2026",
  "Q3 2026",
  "Q4 2026",
  "Q1 2027",
  "Q2 2027",
  "Q3 2027",
  "Q4 2027",
];

/** Index 0-17: vaste agenda-kalender, juni 2026 t/m november 2027. */
export const AGENDA_MONTHS: MonthLabel[] = [
  { y: 2026, m: "Juni" },
  { y: 2026, m: "Juli" },
  { y: 2026, m: "Augustus" },
  { y: 2026, m: "September" },
  { y: 2026, m: "Oktober" },
  { y: 2026, m: "November" },
  { y: 2026, m: "December" },
  { y: 2027, m: "Januari" },
  { y: 2027, m: "Februari" },
  { y: 2027, m: "Maart" },
  { y: 2027, m: "April" },
  { y: 2027, m: "Mei" },
  { y: 2027, m: "Juni" },
  { y: 2027, m: "Juli" },
  { y: 2027, m: "Augustus" },
  { y: 2027, m: "September" },
  { y: 2027, m: "Oktober" },
  { y: 2027, m: "November" },
];

/** Statuscyclus voor project- en milestone-maandcellen: 5 staten, leeg = niet ingevoerd. */
export const PROJECT_MONTH_STATUSES = [
  "green",
  "amber",
  "red",
  "purple",
] as const;
export type ProjectMonthStatus = (typeof PROJECT_MONTH_STATUSES)[number];
export type ProjectMonthStatusOrEmpty = ProjectMonthStatus | "";

/**
 * Statuscyclus voor KPI-kwartaalcellen: 4 staten, geen "purple" — bewuste
 * inconsistentie t.o.v. de project/milestone-cyclus, overgenomen uit de bron.
 */
export const KPI_QUARTER_STATUSES = ["green", "amber", "red"] as const;
export type KpiQuarterStatus = (typeof KPI_QUARTER_STATUSES)[number];
export type KpiQuarterStatusOrEmpty = KpiQuarterStatus | "";

export const KPI_TYPES = ["activiteit", "resultaat"] as const;
export type KpiType = (typeof KPI_TYPES)[number];

export const RESULTAATGEBIEDEN = [
  "Klant- & Marktontwikkeling",
  "Préconners in hun kracht",
  "Digitale tools voor de professional",
  "Impact improvement",
] as const;
export type Resultaatgebied = (typeof RESULTAATGEBIEDEN)[number];

export const MAX_MILESTONES_PER_PROJECT = 10;
export const MAX_KPIS_PER_PROJECT = 4;

/** Cyclus-volgorde die de RagStatusButton client-side gebruikt om de volgende status te berekenen. */
export function nextProjectStatus(
  current: ProjectMonthStatusOrEmpty,
): ProjectMonthStatusOrEmpty {
  const order: ProjectMonthStatusOrEmpty[] = [
    "",
    "green",
    "amber",
    "red",
    "purple",
  ];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length] ?? "";
}

export function nextKpiStatus(
  current: KpiQuarterStatusOrEmpty,
): KpiQuarterStatusOrEmpty {
  const order: KpiQuarterStatusOrEmpty[] = ["", "green", "amber", "red"];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length] ?? "";
}
