import type { NextConfig } from "next";

const useStaticExport = process.env.NEXT_OUTPUT_MODE !== "server";

const nextConfig: NextConfig = {
  ...(useStaticExport ? { output: "export" } : {}),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
