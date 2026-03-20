import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(fileURLToPath(new URL("../..", import.meta.url)))
};

export default nextConfig;
