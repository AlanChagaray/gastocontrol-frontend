/** @type {import('next').NextConfig} */

// URL del backend para permitirla en connect-src del CSP (fetch a la API).
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
let apiOrigin = "http://localhost:8000";
try { apiOrigin = new URL(apiUrl).origin; } catch (_) {}

// CSP: permite estilos inline (la UI usa style={{}}), Google Fonts y la API.
// 'unsafe-eval' es necesario para el hot-reload de `next dev`; se puede quitar en prod.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  `connect-src 'self' ${apiOrigin}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

module.exports = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
