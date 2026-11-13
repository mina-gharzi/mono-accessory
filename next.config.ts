import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  experimental: {
    serverActions: {
      // Admin image uploads allow files up to 5 MB plus multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
  partialPrefetching: true,
  async redirects() {
    return [
      {
        source: "/account",
        destination: "/account/orders",
        permanent: false,
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
