export function sterSym(n: number): string {
  if (n <= 0) return "—";
  return "★".repeat(n) + "☆".repeat(4 - n);
}

export function sterDisplay(score: number): { filled: string; empty: string } {
  if (score <= 0) return { filled: "", empty: "★★★★" };
  return {
    filled: "★".repeat(score),
    empty: "★".repeat(4 - score),
  };
}
