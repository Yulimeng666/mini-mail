// Next.js 配置
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许外部图片域名
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default nextConfig;
