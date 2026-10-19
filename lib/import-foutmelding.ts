import { ZodError } from "zod";

/**
 * Een foutmelding voor het scherm bij een mislukte import. Een ZodError heeft
 * als `message` de volledige lijst validatiefouten als JSON; dat hoort een
 * gebruiker nooit te zien. Andere fouten (bv. "Bestand is te groot") zijn wel
 * bedoeld om voor te lezen.
 */
export function importFoutmelding(error: unknown): string {
  if (error instanceof ZodError) {
    return "Dit bestand bevat gegevens die we niet konden verwerken. Probeer een ander bestand, of vul het gesprek handmatig in.";
  }
  return error instanceof Error && error.message
    ? error.message
    : "Importeren mislukt";
}
