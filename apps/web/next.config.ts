import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Our workspace packages ship raw TypeScript (no build step). Tell Next to
  // transpile them so they work in both the server and client bundles.
  transpilePackages: ["@meta-asset/shelby-client", "@meta-asset/registry-sdk"],
};

export default nextConfig;
