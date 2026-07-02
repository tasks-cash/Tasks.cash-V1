import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  /** Prevent mongoose from being bundled into unstable server chunks */
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
