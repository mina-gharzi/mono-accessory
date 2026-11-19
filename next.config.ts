import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  cacheComponents: true,
  experimental: {
    serverActions: {
      // Admin image uploads allow files up to 5 MB plus multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
  partialPrefetching: true,
  images: {
    // AVIF first, WebP as the fallback for older browsers.
    formats: ["image/avif", "image/webp"],
    // Next 16 requires an explicit allowlist; the components use the default.
    qualities: [75],
    // Only bundled artwork and runtime uploads may be optimized. Uploads are
    // served by app/uploads/[...path]/route.ts from UPLOAD_DIR.
    localPatterns: [
      { pathname: "/images/**", search: "" },
      { pathname: "/uploads/**", search: "" },
    ],
    // Uploaded files are content-addressed by random UUID and never rewritten.
    minimumCacheTTL: 31536000,
  },
  // Runtime uploads are read from UPLOAD_DIR, not from the bundle. That dynamic
  // filesystem access otherwise makes the tracer include the whole project in
  // .next/standalone (source files, tests and the local .env). Keep the
  // standalone output limited to compiled code and dependencies.
  outputFileTracingExcludes: {
    "/*": [
      "./.env",
      "./.env.*",
      "./src/**",
      "./tests/**",
      "./scripts/**",
      "./prisma/**",
      "./docs/**",
      "./public/uploads/**",
    ],
  },
  // The image optimizer loads sharp at runtime. Its native binary and libvips
  // DLLs live in @img/sharp-* and are not discovered by static tracing.
  //
  // Turbopack stores external packages under hashed aliases in
  // .next/node_modules (for example @prisma/client-<hash>). The generated
  // server chunks require those aliases, but tracing does not follow the
  // static external require, so the production server fails with
  // "Cannot find module @prisma/client-<hash>/runtime/client". Include the real
  // packages here; scripts/link-standalone-externals.mjs mirrors the aliases
  // into the standalone output after the build.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/sharp/**/*",
      "./node_modules/@img/**/*",
      "./node_modules/@prisma/client/**/*",
      "./node_modules/@prisma/client-runtime-utils/**/*",
    ],
  },
  async redirects() {
    return [
      {
        source: "/account",
        destination: "/account/orders",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
