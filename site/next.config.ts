import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  eslint: {
    // Allow production builds while we gradually replace <a> with <Link>
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.ur.com.my" },
      { protocol: "http", hostname: "www.ur.com.my" },
    ],
  },
};

export default nextConfig;
