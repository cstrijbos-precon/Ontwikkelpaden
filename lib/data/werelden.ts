export const WERELDEN = ["QA", "RA", "NF", "Learning", "Overhead"] as const;

export type Wereld = (typeof WERELDEN)[number];
