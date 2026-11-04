import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "10.139.32.175:3000",
    "10.139.32.175",
    "jack-responding-alot-aruba.trycloudflare.com",
    "*.trycloudflare.com",
  ],
};

export default nextConfig;
