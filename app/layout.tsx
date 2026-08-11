import type { Metadata } from "next";
import { Libre_Baskerville, Overpass } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

// Lettertypen uit de huisstijl: Libre Baskerville voor koppen, Overpass Light
// voor lopende tekst. Beide staan zo ook in het presentatiesjabloon.
const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
  display: "swap",
});

const overpass = Overpass({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-overpass",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Précon – Persoonlijke Ontwikkelpaden",
  description: "Précon persoonlijke ontwikkelpaden tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="nl"
      className={`${libreBaskerville.variable} ${overpass.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
