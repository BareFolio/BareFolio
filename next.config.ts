import type { NextConfig } from "next";

// ─── Platform kill-switch ─────────────────────────────────────────────
// The platform (logged-in app) is not public yet. Until it launches, every
// platform path must return a REAL 404 (not a soft 404) so nothing is
// visible and nothing gets indexed. We do this with `beforeFiles` rewrites,
// which run BEFORE the filesystem — so they intercept the real page files
// and reroute them to a non-existent destination, producing a genuine
// framework 404 (with automatic noindex).
//
// To launch the platform: set NEXT_PUBLIC_PLATFORM_LIVE=true and redeploy.
const PLATFORM_LIVE = process.env.NEXT_PUBLIC_PLATFORM_LIVE === "true";

const PLATFORM_PATHS = [
  "/home",
  "/posts",
  "/explore",
  "/project",
  "/notifications",
  "/inbox",
  "/onboarding",
  "/profile",
  "/profile/:path*",
];

const nextConfig: NextConfig = {
  // Remove output:'export' for web/Vercel deploy so API routes work.
  // Re-enable for Capacitor native builds: NEXT_CAPACITOR=1 next build
  images: {
    unoptimized: true,
  },
  async rewrites() {
    if (PLATFORM_LIVE) {
      return { beforeFiles: [], afterFiles: [], fallback: [] };
    }
    return {
      beforeFiles: PLATFORM_PATHS.map((source) => ({
        source,
        destination: "/_platform-offline",
      })),
      afterFiles: [],
      fallback: [],
    };
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
  // ─── Owned QR redirect ────────────────────────────────────────────────
  // Self-hosted "dynamic QR" hop. Printed/stickered QR codes encode
  // https://barefolio.com/r — this redirect decides where they actually land,
  // so the destination can be changed here anytime WITHOUT reprinting.
  // `permanent: false` → 307 (temporary, NOT cached by browsers), which is
  // essential: a 308/301 would be cached forever and freeze the destination.
  async redirects() {
    return [
      {
        source: '/r',
        destination: '/waitlist',
        permanent: false,
      },
    ];
  },
};

if (process.env.NEXT_CAPACITOR === "1") {
  nextConfig.output = "export";
}

export default nextConfig;
