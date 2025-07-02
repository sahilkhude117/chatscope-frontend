import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore specific modules during build
      config.externals.push({
        'pdf-parse': 'commonjs pdf-parse'
      });
    }

    // Handle canvas dependency issues
    config.resolve.alias.canvas = false;
    
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
};

export default nextConfig;
