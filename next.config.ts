import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true, // /archive/index.html works on any static host
  outputFileTracingRoot: process.cwd(), // ignore stray lockfiles in parent folders
  // Only needed when hosting under a sub-path (e.g. GitHub Pages project sites).
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
};

export default nextConfig;
