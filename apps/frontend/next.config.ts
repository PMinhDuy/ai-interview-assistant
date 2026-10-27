/* eslint-disable no-console */
import type { NextConfig } from "next";

const targetApiUrl = process.env.NEXT_PUBLIC_API_URL;
const buildNodeEnv = process.env.NODE_ENV;

console.log("=================================================");
console.log("🔍 [FRONTEND BUILD DIAGNOSTICS]");
console.log(`   NODE_ENV             : ${buildNodeEnv ?? 'unknown'}`);
console.log(`   NEXT_PUBLIC_API_URL  : ${targetApiUrl ?? '❌ UNDEFINED (will fallback to localhost:3000)'}`);
console.log("=================================================");

const nextConfig: NextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

