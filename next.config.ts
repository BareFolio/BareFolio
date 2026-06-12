import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove output:'export' for web/Vercel deploy so API routes work.
  // Re-enable for Capacitor native builds: NEXT_CAPACITOR=1 next build
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Long-lived cache for email assets — instant load on repeat opens
        source: '/email/:file*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

if (process.env.NEXT_CAPACITOR === "1") {
  nextConfig.output = "export";
}

export default nextConfig;
