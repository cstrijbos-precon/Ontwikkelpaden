import { isAdmin } from "@/lib/is-admin";

/**
 * De Vlootschouw is alleen voor het MT. Wie dat zijn staat in `APP_MT`
 * (kommagescheiden e-mailadressen) — dezelfde mensen die in de losse
 * Verbeterplanning-app mogen bewerken.
 *
 * Staat de lijst leeg, dan ziet niemand de Vlootschouw behalve beheerders.
 * Dat is met opzet: een lege lijst hoort niet "iedereen mag" te betekenen.
 */
export function isMtLid(email: string | null | undefined): boolean {
  const adres = String(email || "")
    .toLowerCase()
    .trim();
  if (!adres) return false;
  if (isAdmin(adres)) return true;

  return (process.env.APP_MT || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(adres);
}
