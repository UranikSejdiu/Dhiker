import type { NextConfig } from "next"
import withSerwistInit from "@serwist/next"

const withSerwist = withSerwistInit({
  disable: process.env.NODE_ENV === "development",
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: true,
})

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  turbopack: {},
}

export default withSerwist(nextConfig)
