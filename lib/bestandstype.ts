export type Bestandstype = "docx" | "pdf";

/**
 * Bepaalt het type op de eerste bytes, niet op de bestandsnaam. Een hernoemd
 * bestand levert anders een onbegrijpelijke foutmelding op.
 *
 * - PDF begint met `%PDF`
 * - DOCX is een zip en begint met `PK`
 */
export function herkenBestandstype(buffer: ArrayBuffer): Bestandstype | null {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  if (bytes.length < 2) return null;

  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return "pdf";
  }

  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "docx";

  return null;
}
