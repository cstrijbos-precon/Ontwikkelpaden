const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parts = value.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y === undefined || m === undefined || d === undefined) return false;
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  );
}

/** Leeg of geldig YYYY-MM-DD — enige plek voor datum-invoer. */
export function enforceDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return isValidIsoDate(trimmed) ? trimmed : "";
}

/** Voor Postgres DATE-kolommen: null i.p.v. leeg. */
export function enforceDateOrNull(value: string): string | null {
  const date = enforceDate(value);
  return date || null;
}

/** Datum uit de database (string of Date) naar YYYY-MM-DD. */
export function formatDateFromDb(value: unknown): string | null {
  if (value == null) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return enforceDate(`${y}-${m}-${d}`);
  }

  if (typeof value === "string") {
    return enforceDateOrNull(value);
  }

  return null;
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(4, Math.max(0, Math.round(value)));
}

export function clampPadNiveau(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(5, Math.max(0, Math.round(value)));
}
