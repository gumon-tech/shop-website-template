// Fails (exit 1) when the repository carries something it must never publish. Runs first in `npm run validate`, so in CI too.
//   1. Secrets: private keys, GitHub / cloud / Stripe / Slack tokens, or a password, token or key assigned a literal value.
//      This repository is public and needs none (the workflows use the built-in GITHUB_TOKEN only).
//   2. Words of the first shop this template was made from (its name, street, phone numbers, domain). A copy-paste from that
//      site would put another business's details on this one.
//   3. Placeholder values, once the site belongs to a real shop: "Example Shop", example.com, the +44 7700 900xxx fiction
//      range, an unfilled data/shop.json. The template repository itself (data/shop.json shopId "example") is allowed them.
// Plain Node, no dependencies, offline.
//   node scripts/check-template.mjs
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELF = path.relative(root, fileURLToPath(import.meta.url)).split(path.sep).join("/");
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "out", ".claude"]);
const TEXT = /\.(?:m?[jt]sx?|json|md|ya?ml|css|txt|html|svg|mjs|cjs|gitignore|gitattributes)$|(?:^|\/)(?:CNAME|\.gitignore|\.gitattributes)$/;

// The first shop's words, stored as base64 so this file itself never contains them in plain text.
const FIRST_SHOP = JSON.parse(Buffer.from(
  "WyJzcmkgc2lhbSIsInNyaXNpYW0iLCJjdXR0eSBzYXJrIiwid2F0IHBobyIsImdsYWlzaGVyIiwiY29yYnJpZGdlIiwic2U4IDNldCIsIjc5MDMgNjUzNzg2IiwiNzkwMzY1Mzc4NiIsIjA3NDk3IiwiNzQ5NyA0OTMiLCI1Mjg5NzAiLCJjYXJuYWJ5Iiwic29sdXRpb24tc3N0Il0=",
  "base64",
).toString("utf8"));
const FIRST_SHOP_RE = new RegExp(FIRST_SHOP.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s*")).join("|"), "i");
const SST_WORD = /(?<![A-Za-z0-9_-])sst(?![A-Za-z0-9_])/i;

const SECRETS = [
  [/-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/, "a private key"],
  [/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/, "a GitHub token"],
  [/\bAKIA[0-9A-Z]{16}\b/, "an AWS access key"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, "a Google API key"],
  [/\b(?:sk|rk)_(?:live|test)_[0-9A-Za-z]{16,}\b|\bwhsec_[0-9A-Za-z]{20,}\b/, "a Stripe key"],
  [/\bxox[abposr]-[0-9A-Za-z-]{10,}\b/, "a Slack token"],
  [/\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}\b/, "an API key (sk-...)"],
  [/\b(?:password|passwd|secret|token|api[_-]?key|access[_-]?key|client[_-]?secret)["']?\s*[:=]\s*["'][^"'\s${}]{12,}["']/i, "a credential assigned a literal value"],
];

const PLACEHOLDERS = [
  [/Example Shop/, '"Example Shop"'],
  [/\bexample\.(?:com|org|net)\b/i, "an example.com address"],
  [/(?:\+44\s?7700\s?900\d{3}|\b07700\s?900\d{3}\b|447700900\d{3})/, "a +44 7700 900xxx fiction-range number"],
  [/\bREPLACE[_ ]?ME\b|\bTODO-SHOP\b/, "a REPLACE_ME marker"],
];
// Where placeholders matter once a shop owns the repository: what the site is built from.
const SHOP_FILES = /^(?:data\/|content\/|public\/CNAME$)/;

const files = [];
(function walk(dir) {
  for (const n of readdirSync(dir)) {
    if (SKIP_DIRS.has(n) || n.startsWith(".next")) continue;
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(path.relative(root, p).split(path.sep).join("/"));
  }
})(root);

const shop = JSON.parse(readFileSync(path.join(root, "data/shop.json"), "utf8"));
const isTemplate = shop.shopId === "example";
const errors = [];
for (const rel of files) {
  if (rel === SELF || !TEXT.test(rel)) continue;
  const text = readFileSync(path.join(root, rel), "utf8");
  for (const [re, what] of SECRETS) if (re.test(text)) errors.push(`${rel}: looks like ${what}; remove it (this repository is public)`);
  if (FIRST_SHOP_RE.test(text) || SST_WORD.test(text)) errors.push(`${rel}: names the shop this template was made from ("${(FIRST_SHOP_RE.exec(text) ?? SST_WORD.exec(text))[0]}")`);
  if (!isTemplate && SHOP_FILES.test(rel) && !rel.startsWith("data/text-rules")) {
    for (const [re, what] of PLACEHOLDERS) if (re.test(text)) errors.push(`${rel}: still has ${what}; run scripts/new-shop.mjs with the shop's own details`);
  }
}

if (!isTemplate) {
  for (const k of ["shopId", "name", "country", "timezone", "locale"]) if (typeof shop[k] !== "string" || !shop[k].trim()) errors.push(`data/shop.json: ${k} is missing`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(shop.shopId ?? "")) errors.push("data/shop.json: shopId must be lower-case letters, digits and hyphens");
  try {
    new Intl.DateTimeFormat("en", { timeZone: shop.timezone });
  } catch {
    errors.push(`data/shop.json: timezone "${shop.timezone}" is not an IANA timezone (say Europe/London)`);
  }
  const cname = path.join(root, "public/CNAME");
  if (existsSync(cname) && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(readFileSync(cname, "utf8").trim())) errors.push("public/CNAME must hold one domain name");
}

if (errors.length) {
  console.error(`check-template: ${errors.length} problem(s)\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log(`check-template OK: ${files.length} files, no secrets, no first-shop words${isTemplate ? " (template repository: placeholders allowed)" : ", no placeholders"}`);
