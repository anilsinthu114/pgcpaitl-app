import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/draft",
        destination: "http://localhost:5000/draft",
      },
      {
        source: "/payment/submit",
        destination: "http://localhost:5000/payment/submit",
      },
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
