import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Both apex and www resolve to this project; Server Actions verify Origin
    // against this list, so a missing entry rejects legitimate form posts.
    serverActions: {
      allowedOrigins: ["freshcutzbarber.co", "www.freshcutzbarber.co"],
    },
  },
};

export default nextConfig;
