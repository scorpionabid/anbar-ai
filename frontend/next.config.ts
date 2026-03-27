import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl.replace("/api/v1", "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
