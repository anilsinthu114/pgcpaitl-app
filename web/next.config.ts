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
        source: "/payment.html",
        destination: "/payment",
      },
      {
        source: "/check-status.html",
        destination: "/status",
      },
      {
        source: "/fee-rules.html",
        destination: "/rules",
      },
      {
        source: "/application/:path*",
        destination: "http://localhost:5000/application/:path*",
      },
      {
        source: "/payment/:path*",
        destination: "http://localhost:5000/payment/:path*",
      },
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:5000/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
