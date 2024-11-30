import { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'encoding');

    return config;
  }
};

export default nextConfig;
