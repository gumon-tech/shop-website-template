// Self-test for scripts/new-shop.mjs: runs it on copies of this repository (no network, no node_modules needed) and checks
// that a good brief produces a repository every validator accepts, and that bad briefs write nothing.
// Run: node scripts/test-new-shop.mjs
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const before = JSON.parse(readFileSync(path.join(root, "data/shop.json"), "utf8")).shopId;
const example = JSON.parse(readFileSync(path.join(root, "examples/new-shop.example.json"), "utf8"));
let failed = 0;
const t = (name, ok, detail = "") => {
  if (ok) console.log(`ok   ${name}`);
  else {
    failed++;
    console.error(`FAIL ${name}\n${detail}`);
  }
};

function copyRepo() {
  const dir = mkdtempSync(path.join(os.tmpdir(), "new-shop-"));
  for (const d of ["data", "content", "scripts", "examples", "public", ".github"]) cpSync(path.join(root, d), path.join(dir, d), { recursive: true });
  return dir;
}
function newShop(brief, flags = ["--skip-images"]) {
  const dir = copyRepo();
  const f = path.join(dir, "brief.json");
  writeFileSync(f, JSON.stringify(brief));
  const r = spawnSync(process.execPath, [path.join(dir, "scripts/new-shop.mjs"), f, ...flags], { cwd: dir, encoding: "utf8" });
  return { dir, r, json: (rel) => JSON.parse(readFileSync(path.join(dir, rel), "utf8")) };
}
const node = (dir, script, ...a) => spawnSync(process.execPath, [path.join(dir, script), ...a], { cwd: dir, encoding: "utf8" });

// 1. The example brief (with --allow-example), then every validator that needs no node_modules.
{
  const { dir, r, json } = newShop(example, ["--skip-images", "--allow-example"]);
  t("example brief is accepted", r.status === 0, r.stderr + r.stdout);
  if (r.status === 0) {
    t("data/shop.json is the identity", JSON.stringify(json("data/shop.json")) === JSON.stringify({ shopId: "lotus-thai-spa", name: "Lotus Thai Spa", country: "GB", timezone: "Europe/London", locale: "en-GB" }));
    t("whatsapp same-as-phone", json("data/business.json").whatsapp === "442079460123");
    t("hours written", json("data/hours.json").hours.Thursday?.closes === "20:00" && json("data/hours.json").hours.Monday === null);
    t("services written with option text", json("data/services.json").services.map((s) => s.option).join() === "1 hour,90 minutes");
    t("brand shades derived", /^#[0-9A-F]{6}$/.test(json("data/brand.json").colors.primary_deep));
    t("no CNAME without a domain", !existsSync(path.join(dir, "public/CNAME")));
    t("photo slots for the new treatment", json("scripts/lib/photo-slots.json").slots.some((s) => s.id === "treatment.thai-massage.card"));
    for (const v of ["check-template.mjs", "sync-slots.mjs --check", "validate-services.mjs", "validate-copy.mjs", "validate-seo.mjs", "validate-promotions.mjs", "validate-hours.mjs", "validate-closures.mjs", "validate-notice.mjs", "validate-faq-extra.mjs"]) {
      const [s, ...a] = v.split(" ");
      const x = node(dir, `scripts/${s}`, ...a);
      t(`after new-shop: ${v}`, x.status === 0, x.stderr + x.stdout);
    }
  }
  rmSync(dir, { recursive: true, force: true });
}

// 2. A domain writes public/CNAME.
{
  const { dir, r } = newShop({ ...example, _example: undefined, shopId: "rose-beauty", name: "Rose Beauty Rooms", domain: "www.rosebeautyrooms.co.uk", services: undefined, promotions: undefined, faq: undefined });
  t("domain writes public/CNAME", r.status === 0 && readFileSync(path.join(dir, "public/CNAME"), "utf8").trim() === "www.rosebeautyrooms.co.uk", r.stderr);
  rmSync(dir, { recursive: true, force: true });
}

// 3. Bad briefs write nothing.
const bad = [
  ["the example file without --allow-example", example],
  ["placeholder name", { ...example, _example: undefined, name: "Example Shop" }],
  ["placeholder email", { ...example, _example: undefined, email: "hello@example.com" }],
  ["fiction-range mobile", { ...example, _example: undefined, phone: "+44 7700 900123" }],
  ["bad timezone", { ...example, _example: undefined, timezone: "London" }],
  ["bad shopId", { ...example, _example: undefined, shopId: "Lotus Spa" }],
  ["shopId example", { ...example, _example: undefined, shopId: "example" }],
  ["bad hours", { ...example, _example: undefined, hours: { Monday: "9-5" } }],
  ["bad colour", { ...example, _example: undefined, brand: { primary: "green", accent: "#C9A227" } }],
  ["unknown field", { ...example, _example: undefined, colour: "#000000" }],
  ["another language", { ...example, _example: undefined, languages: ["th-TH"] }],
];
for (const [name, brief] of bad) {
  const { dir, r, json } = newShop(brief);
  t(`refused: ${name}`, r.status === 1 && json("data/shop.json").shopId === before, r.stdout + r.stderr);
  rmSync(dir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("new-shop tests passed");
