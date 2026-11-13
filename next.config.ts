import type { NextConfig } from "next";

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
