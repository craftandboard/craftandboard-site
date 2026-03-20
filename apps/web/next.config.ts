import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(fileURLToPath(new URL("../..", import.meta.url))),
  async headers() {
    const crawlHeaders = [
      {
        key: "Cache-Control",
        value: "public, max-age=0, must-revalidate"
      }
    ];

    return [
      { source: "/", headers: crawlHeaders },
      { source: "/shop", headers: crawlHeaders },
      { source: "/shop/:path*", headers: crawlHeaders },
      { source: "/guides", headers: crawlHeaders },
      { source: "/guides/:path*", headers: crawlHeaders },
      { source: "/floating-shelves/:path*", headers: crawlHeaders },
      { source: "/floating-mantels/:path*", headers: crawlHeaders },
      { source: "/faq", headers: crawlHeaders },
      { source: "/gallery", headers: crawlHeaders },
      { source: "/about", headers: crawlHeaders },
      { source: "/contact", headers: crawlHeaders },
      { source: "/robots.txt", headers: crawlHeaders },
      { source: "/sitemap.xml", headers: crawlHeaders }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      }
    ]
  }
};

export default nextConfig;
