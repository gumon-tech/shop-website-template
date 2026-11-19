// next.config.mjs
// Static export to out/. Served either from a custom domain (public/CNAME) at "/" or from https://<owner>.github.io/<repo>/
// under a base path; scripts/lib/site-config.mjs decides which, and passes both to the site as NEXT_PUBLIC_* values.
import { siteConfig } from "./scripts/lib/site-config.mjs";

const { basePath, url } = siteConfig(process.cwd());

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: process.env.NEXT_DIST_DIR || ".next",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_SITE_URL: url },
};

export default nextConfig;
