import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.ur.com.my" },
      { protocol: "http", hostname: "www.ur.com.my" },
    ],
  },
};

export default nextConfig;
