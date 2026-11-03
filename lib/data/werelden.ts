export const WERELDEN = [
  "QA",
  "RA",
  "NF",
  "Learning",
  "Overhead",
  "Support",
] as const;

export type Wereld = (typeof WERELDEN)[number];
