/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@tasks-cash/ui", "@tasks-cash/types", "@tasks-cash/utils"],
  images: { unoptimized: true },
};

module.exports = nextConfig;
