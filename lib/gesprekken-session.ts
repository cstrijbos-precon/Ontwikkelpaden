const GESPREK_ID_KEY = "precon_gesprek_id";

export function getStoredGesprekId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(GESPREK_ID_KEY);
}

export function setStoredGesprekId(id: string): void {
  sessionStorage.setItem(GESPREK_ID_KEY, id);
}
