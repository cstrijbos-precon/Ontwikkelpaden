import type { NextConfig } from "next";

/**
 * 'unsafe-inline' voor script/style blijft nodig: Next.js' eigen
 * hydratatiescripts en de vele inline style={{...}} in de app zouden anders
 * breken. Nonces zouden dit dichter kunnen zetten, maar dat is een grotere
 * losse klus (middleware die per request een nonce genereert en doorgeeft).
 * 'unsafe-eval' alleen in development: React's dev-mode gebruikt eval() voor
 * betere stacktraces; de productiebuild doet dat nooit.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // API-antwoorden bevatten sessiegebonden data — nooit cachen, ook niet
      // door een tussenliggende proxy of de browser zelf.
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
