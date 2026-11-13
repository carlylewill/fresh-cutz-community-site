import type { NextConfig } from "next";

// Report-Only so it can never break a page. Origins are the ones the code uses:
// Google Analytics (next/third-parties), the Google Maps embed iframe, own images.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  "frame-src https://www.google.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  experimental: {
    inlineCss: true,
    // Both apex and www resolve to this project; Server Actions verify Origin
    // against this list, so a missing entry rejects legitimate form posts.
    serverActions: {
      allowedOrigins: ["freshcutzbarber.co", "www.freshcutzbarber.co"],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
      {
        // The token in a booking URL IS the authorisation — there is no login.
        // robots.txt asks crawlers not to fetch these; this header means that
        // even a crawler that ignores robots.txt (or a token pasted into a
        // service that previews links) cannot put one in an index. no-store
        // also keeps a token-scoped page out of any shared CDN cache.
        source: "/booking/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
