import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove output:'export' for web/Vercel deploy so API routes work.
  // Re-enable for Capacitor native builds: NEXT_CAPACITOR=1 next build
  images: {
    unoptimized: true,
  },
};

if (process.env.NEXT_CAPACITOR === "1") {
  nextConfig.output = "export";
}

export default nextConfig;
