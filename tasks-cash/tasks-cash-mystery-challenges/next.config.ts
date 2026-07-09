import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  /** Prevent mongoose from being bundled into unstable server chunks */
  serverExternalPackages: ["mongoose"],
  async redirects() {
    return [
      {
        source: "/challenges-arena",
        destination: "/",
        permanent: true,
      },
      {
        source: "/challenges-arena/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
