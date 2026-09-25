/**
 * Escaped tekst voor gebruik in een HTML-context (mailtemplates, export).
 * Voorkomt dat een naam of ander vrij-tekstveld als HTML wordt geïnterpreteerd.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
