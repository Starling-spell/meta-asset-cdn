import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Our workspace packages ship raw TypeScript (no build step). Tell Next to
  // transpile them so they work in both the server and client bundles.
  transpilePackages: ["@meta-asset/shelby-client", "@meta-asset/registry-sdk"],
  // The Shelby SDK (server-only) pulls native/wasm erasure-coding deps. Keep it out of
  // the webpack bundle and require it at runtime from node_modules.
  serverExternalPackages: ["@shelby-protocol/sdk", "@shelby-protocol/clay-codes", "@shelby-protocol/reed-solomon"],
};

export default nextConfig;
