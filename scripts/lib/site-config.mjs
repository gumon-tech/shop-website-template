// Where the site is served: the base path (empty on a custom domain, "/<repo>" on <owner>.github.io/<repo>/) and the absolute URL
// that canonical links, the sitemap, JSON-LD and build.json use. One place, read by next.config.mjs and by the check scripts.
//   SITE_BASE_PATH  overrides the base path ("" or "/something")
//   SITE_URL        overrides the absolute URL (no trailing slash; includes the base path)
//   public/CNAME    a custom domain: base path "" and https://<domain>
//   GITHUB_REPOSITORY (set by GitHub Actions) without CNAME: https://<owner>.github.io/<repo> under /<repo>
// Plain Node, no dependencies.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const clean = (p) => {
  const t = String(p ?? "").trim().replace(/\/+$/, "");
  if (!t) return "";
  return t.startsWith("/") ? t : `/${t}`;
};

export function siteConfig(root, env = process.env) {
  const cnameFile = path.join(root, "public", "CNAME");
  const cname = existsSync(cnameFile) ? readFileSync(cnameFile, "utf8").trim() : "";
  const repo = env.GITHUB_REPOSITORY ?? "";
  const [owner = "", name = ""] = repo.split("/");
  const userSite = name && owner && name.toLowerCase() === `${owner.toLowerCase()}.github.io`;
  let basePath;
  if (env.SITE_BASE_PATH !== undefined) basePath = clean(env.SITE_BASE_PATH);
  else if (cname || !name || userSite) basePath = "";
  else basePath = `/${name}`;
  let url = (env.SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (!url) {
    if (cname) url = `https://${cname}`;
    else if (owner) url = `https://${owner.toLowerCase()}.github.io${basePath}`;
    else url = `http://localhost:3000${basePath}`;
  }
  return { basePath, url, cname };
}
