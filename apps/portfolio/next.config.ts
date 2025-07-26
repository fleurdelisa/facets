import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      // Add alias for your UI package
      '@facets/ui': path.resolve(__dirname, '../../packages/ui/src'),
      // Enable importing CSS/other files from node_modules
      'next/font': path.resolve(__dirname, 'node_modules/next/font'),
    };

    // Important: return the modified config
    return config;
  },
  // Add support for importing TypeScript files from the UI package
  transpilePackages: ["@facets/ui"],
  // Enable experimental features for better monorepo support
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
