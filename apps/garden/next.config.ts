import type { NextConfig } from "next";

// Static export: every page is pre-built to HTML at build time, so the site
// can be served by Cloudflare Pages without a server or database.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
