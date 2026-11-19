// Fills a copy of this template with one shop's details: the first step when the team builds a shop's site.
//   node scripts/new-shop.mjs <shop.json> [--allow-example] [--skip-images]
// Input: one small JSON file (see examples/new-shop.example.json and TEMPLATE.md, "The brief"). Writes:
//   data/shop.json        identity: shopId, name, country, timezone, locale (only this script writes it)
//   data/business.json    tagline, address, phone, WhatsApp, email, map link, deposit, indexable, schema.org type
//   data/brand.json       colours (from one primary and one accent colour), wordmark
//   data/hours.json       weekly hours
//   data/services.json    the menu (when "services" is given)
//   data/faq-extra.json   extra questions (when "faq" is given), data/promotions.json offers (when "promotions" is given)
//   data/text-rules.json  shop wording rules (when "text_rules" is given)
//   public/CNAME          the custom domain, or removed when there is none (the site is then served at <owner>.github.io/<repo>/)
// then rebuilds the slot lists (scripts/sync-slots.mjs), the share image and icons (scripts/make-og.mjs), and runs
// scripts/check-template.mjs, which fails on any placeholder, first-shop word or secret left in the repository.
// Refuses placeholder values in the input ("Example Shop", example.com, +44 7700 900xxx, REPLACE_ME) and the shipped example
// file (it carries "_example": true; --allow-example is for the tests). Offline; no network, no GitHub.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const inputPath = args.find((a) => !a.startsWith("--"));
const allowExample = args.includes("--allow-example");
const skipImages = args.includes("--skip-images");
if (!inputPath) {
  console.error("usage: node scripts/new-shop.mjs <shop.json> [--allow-example] [--skip-images]\nStart from examples/new-shop.example.json; TEMPLATE.md explains every field.");
  process.exit(2);
}

const errors = [];
const fail = (m) => errors.push(m);
let input;
try {
  input = JSON.parse(readFileSync(inputPath, "utf8"));
} catch (e) {
  console.error(`${inputPath}: not readable JSON (${e.message})`);
  process.exit(1);
}

const KNOWN = ["_example", "_about", "shopId", "name", "country", "timezone", "locale", "languages", "domain", "tagline", "phone", "whatsapp", "email", "address", "geo", "maps_url", "hours", "brand", "wordmark", "deposit_gbp", "indexable", "business_type", "area_served", "payment_accepted", "privacy_updated", "treatment_tags", "services", "faq", "promotions", "text_rules"];
for (const k of Object.keys(input)) if (!KNOWN.includes(k)) fail(`unknown field "${k}" (known: ${KNOWN.filter((x) => !x.startsWith("_")).join(", ")})`);
if (input._example === true && !allowExample) fail('this is the example brief ("_example": true): copy it, put the shop\'s own details in, and remove "_example"');

// ---------------------------------------------------------------- placeholders anywhere in the input
const PLACEHOLDER = [/Example Shop/i, /\bexample\.(?:com|org|net)\b/i, /(?:\+?44\s?7700\s?900\d{3}|\b07700\s?900\d{3}\b)/, /\bREPLACE[_ ]?ME\b/i, /\bTODO\b/, /\bxxx+\b/i, /lorem ipsum/i];
(function walk(v, at) {
  if (typeof v === "string") {
    for (const re of PLACEHOLDER) if (re.test(v)) fail(`${at}: "${v}" is a placeholder; use the shop's real value or leave the field out`);
  } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (!k.startsWith("_")) walk(x, at ? `${at}.${k}` : k);
})(input, "");

// ---------------------------------------------------------------- identity
const str = (v) => typeof v === "string" && v.trim() !== "";
const shopId = input.shopId;
if (!str(shopId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(shopId)) fail("shopId: lower-case letters, digits and hyphens (the repository is gumon-tech/shop-site-<shopId>)");
if (shopId === "example") fail('shopId: "example" is the template\'s own id');
if (!str(input.name) || input.name.length > 60) fail("name: the shop's name as customers know it, at most 60 characters");
const country = input.country ?? "GB";
if (!/^[A-Z]{2}$/.test(country)) fail('country: two capital letters (ISO 3166), say "GB"');
const timezone = input.timezone ?? "Europe/London";
try {
  new Intl.DateTimeFormat("en", { timeZone: timezone });
} catch {
  fail(`timezone: "${timezone}" is not an IANA timezone (say "Europe/London")`);
}
const locale = input.locale ?? "en-GB";
if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(locale)) fail('locale: say "en-GB"');
const languages = input.languages ?? [locale];
if (!Array.isArray(languages) || languages.some((l) => !/^en\b/.test(l))) fail("languages: the template's pages and the shop system's text rules are English only; other languages are not supported yet");

// ---------------------------------------------------------------- business facts
const opt = (v) => (v === undefined || v === null || v === "" ? null : v);
const e164 = (v) => String(v).replace(/[^\d+]/g, "");
let phone = null;
if (opt(input.phone) !== null) {
  const p = typeof input.phone === "string" ? { display: input.phone, e164: e164(input.phone) } : input.phone;
  if (!str(p?.display) || !/^\+\d{8,15}$/.test(p?.e164 ?? "")) fail('phone: "+44 20 7946 0123" (international form) or {"display": "020 7946 0123", "e164": "+442079460123"}');
  else phone = { display: p.display.trim(), e164: p.e164 };
}
let whatsapp = null;
if (opt(input.whatsapp) !== null) {
  const digits = String(input.whatsapp === "same-as-phone" ? phone?.e164 ?? "" : input.whatsapp).replace(/\D/g, "");
  if (!/^\d{8,15}$/.test(digits) || /^0/.test(digits)) fail('whatsapp: the number in international form ("+44 7123 456789"), or "same-as-phone"');
  else whatsapp = digits;
}
const email = opt(input.email);
if (email !== null && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) fail("email: one address");
const domain = opt(input.domain)?.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") ?? null;
if (domain !== null && !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(domain)) fail('domain: a host name such as "www.shopname.co.uk", or null to serve at gumon-tech.github.io/shop-site-<shopId>/');
let address = null;
if (opt(input.address) !== null) {
  const a = input.address;
  if (!str(a?.street) || !str(a?.locality) || !str(a?.postal_code)) fail('address: {"street", "locality", "postal_code"} (and optional "region", "country")');
  else address = { street: a.street.trim(), locality: a.locality.trim(), region: opt(a.region), postal_code: a.postal_code.trim(), country: opt(a.country) ?? country };
}
const geo = opt(input.geo);
if (geo !== null && !(typeof geo.latitude === "number" && typeof geo.longitude === "number")) fail('geo: {"latitude": 51.5, "longitude": -0.1} or null');
const mapsUrl = opt(input.maps_url);
if (mapsUrl !== null && !/^https:\/\/(?:maps\.google\.[a-z.]+|www\.google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)\b/.test(mapsUrl)) fail("maps_url: the shop's Google Maps link (https://maps.app.goo.gl/... or https://www.google.com/maps/...)");
const deposit = opt(input.deposit_gbp);
if (deposit !== null && !(Number.isInteger(deposit) && deposit > 0 && deposit <= 200)) fail("deposit_gbp: whole pounds, or null when the shop takes no deposit");
const tagline = opt(input.tagline);
if (tagline !== null && (typeof tagline !== "string" || tagline.length > 90)) fail("tagline: one line, at most 90 characters");
const businessType = opt(input.business_type) ?? "HealthAndBeautyBusiness";
if (!/^[A-Z][A-Za-z]+$/.test(businessType)) fail('business_type: a schema.org type such as "DaySpa", "BeautySalon", "HealthAndBeautyBusiness"');
const tags = input.treatment_tags ?? {};
for (const [slug, t] of Object.entries(tags)) if (!/^[A-Z]{1,2}$/.test(t)) fail(`treatment_tags.${slug}: one or two capital letters`);
if (opt(input.privacy_updated) !== null && !/^\d{1,2} [A-Z][a-z]+ \d{4}$/.test(input.privacy_updated)) fail('privacy_updated: "19 November 2026"');

// ---------------------------------------------------------------- hours
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const hours = Object.fromEntries(DAYS.map((d) => [d, null]));
if (opt(input.hours) !== null) {
  for (const k of Object.keys(input.hours)) if (!DAYS.includes(k)) fail(`hours: unknown day "${k}"`);
  for (const d of DAYS) {
    const v = input.hours[d];
    if (v === undefined || v === null || v === "closed") continue;
    const m = /^([01]\d|2[0-3]):(00|15|30|45)\s*-\s*([01]\d|2[0-3]):(00|15|30|45)$/.exec(String(v));
    if (!m) {
      fail(`hours.${d}: "10:00-19:00" (24 h, minutes 00/15/30/45) or "closed"`);
      continue;
    }
    const opens = `${m[1]}:${m[2]}`;
    const closes = `${m[3]}:${m[4]}`;
    if (opens >= closes || opens < "06:00" || closes > "23:00") fail(`hours.${d}: opens before closes, between 06:00 and 23:00`);
    hours[d] = { opens, closes };
  }
}

// ---------------------------------------------------------------- brand
const HEX = /^#[0-9a-f]{6}$/i;
const brandIn = input.brand ?? {};
const primary = brandIn.primary ?? "#3F4A5A";
const accent = brandIn.accent ?? "#B59A5B";
if (!HEX.test(primary) || !HEX.test(accent)) fail('brand: {"primary": "#5B1E70", "accent": "#D4AF37"} (#RRGGBB)');
const mix = (hex, to, t) => {
  const a = parseInt(hex.slice(1), 16);
  const b = to === "white" ? 0xffffff : 0;
  const ch = (n, s) => Math.round(((n >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return `#${[16, 8, 0].map((s) => ch(a, s).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
};
let wordmark = null;
if (opt(input.wordmark) !== null) {
  if (!str(input.wordmark.line1)) fail('wordmark: {"line1": "Lotus", "line2": "Thai Spa"} or null');
  else wordmark = { line1: input.wordmark.line1, line2: input.wordmark.line2 ?? "" };
}

// ---------------------------------------------------------------- services
const optionText = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0 || (h === 1 && m === 30)) return `${min} minutes`;
  if (m === 0) return h === 1 ? "1 hour" : `${h} hours`;
  return `${h} ${h === 1 ? "hour" : "hours"} ${m} minutes`;
};
const slugify = (s) => s.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
let services = null;
if (opt(input.services) !== null) {
  services = [];
  if (!Array.isArray(input.services)) fail('services: [{"group", "name", "options": [{"minutes": 60, "price": 55}]}]');
  else
    for (const [i, s] of input.services.entries()) {
      if (!str(s?.group) || !str(s?.name) || !Array.isArray(s?.options) || !s.options.length) {
        fail(`services[${i}]: needs group, name and at least one option`);
        continue;
      }
      const slug = s.slug ?? slugify(s.name);
      for (const [j, o] of s.options.entries()) {
        if (!Number.isInteger(o?.minutes) || typeof o?.price !== "number") {
          fail(`services[${i}].options[${j}]: {"minutes": 60, "price": 55}`);
          continue;
        }
        services.push({ group: s.group, slug, name: s.name, option: optionText(o.minutes), duration_min: o.minutes, price_gbp: o.price });
      }
    }
}

// ---------------------------------------------------------------- faq, promotions (the shop system's files; first entries only)
const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const code = (prefix, text) => `${prefix}-${createHash("sha256").update(text).digest("hex").slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, "X")}`;
const dateLabel = (s) => {
  const d = new Date(`${s}T00:00:00Z`);
  const f = (o) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...o }).format(d);
  return `${f({ weekday: "long" })} ${d.getUTCDate()} ${f({ month: "long" })} ${d.getUTCFullYear()}`;
};
let faq = null;
if (opt(input.faq) !== null) {
  faq = (Array.isArray(input.faq) ? input.faq : []).map((q) => ({ code: code("Q", q.question ?? ""), question: q.question, answer: q.answer, status: "live" }));
}
let promotions = null;
if (opt(input.promotions) !== null) {
  promotions = (Array.isArray(input.promotions) ? input.promotions : []).map((p) => ({
    code: p.code ?? code("P", `${p.title}|${p.starts}`),
    title: p.title,
    eyebrow: p.eyebrow ?? "Special offer",
    detail: p.detail,
    points: p.points ?? [],
    offer: p.offer ?? "Mention this offer on WhatsApp or when you arrive",
    message: p.message ?? `Hi ${input.name}, I'd like to book with the ${p.title} offer.`,
    image: null,
    illustrative: false,
    starts: p.starts,
    ends: p.ends,
    ends_label: p.ends ? dateLabel(p.ends) : "",
    status: p.status ?? "live",
  }));
}
if (opt(input.text_rules) !== null) {
  const t = input.text_rules;
  if (t.short_name) {
    try {
      new RegExp(t.short_name);
    } catch {
      fail("text_rules.short_name: not a valid regular expression");
    }
  }
}

if (errors.length) {
  console.error(`new-shop: ${errors.length} problem(s) in ${inputPath}, nothing written:\n- ` + errors.join("\n- "));
  process.exit(1);
}

// ---------------------------------------------------------------- write
const p = (rel) => path.join(root, rel);
const pretty = (o) => JSON.stringify(o, null, 2) + "\n";
const readJson = (rel) => JSON.parse(readFileSync(p(rel), "utf8"));
const written = [];
const write = (rel, text) => {
  writeFileSync(p(rel), text);
  written.push(rel);
};

write("data/shop.json", pretty({ shopId, name: input.name.trim(), country, timezone, locale }));
const business = readJson("data/business.json");
write(
  "data/business.json",
  pretty({
    _about: business._about,
    tagline,
    address,
    geo,
    phone,
    whatsapp,
    email,
    maps_url: mapsUrl,
    deposit_gbp: deposit,
    indexable: input.indexable ?? Boolean(domain),
    business_type: businessType,
    area_served: opt(input.area_served),
    payment_accepted: opt(input.payment_accepted),
    privacy_updated: opt(input.privacy_updated),
    treatment_tags: tags,
  }),
);
const brand = readJson("data/brand.json");
write(
  "data/brand.json",
  pretty({
    _about: brand._about,
    colors: {
      ...brand.colors,
      primary: primary.toUpperCase(),
      primary_deep: mix(primary, "black", 0.25),
      primary_mid: mix(primary, "white", 0.2),
      primary_tint: mix(primary, "white", 0.88),
      accent: accent.toUpperCase(),
      accent_pale: mix(accent, "white", 0.55),
      accent_deep: mix(accent, "black", 0.4),
      ...(brandIn.colors ?? {}),
    },
    logo: brand.logo ?? null,
    wordmark,
  }),
);
write("data/hours.json", pretty({ updated_at: nowIso, hours }));
if (services) {
  const cur = readJson("data/services.json");
  write("data/services.json", pretty({ ...cur, source: "The shop's menu, set up by the Gumon team", read_at: nowIso.replace("Z", "+00:00"), services }));
}
if (faq) write("data/faq-extra.json", pretty({ updated_at: nowIso, questions: faq }));
if (promotions) write("data/promotions.json", pretty({ updated_at: nowIso, promotions }));
if (opt(input.text_rules) !== null) {
  const cur = readJson("data/text-rules.json");
  write("data/text-rules.json", pretty({ _about: cur._about, short_name: input.text_rules.short_name ?? null, never_words: input.text_rules.never_words ?? [], old_number_fragments: input.text_rules.old_number_fragments ?? [] }));
}
if (domain) write("public/CNAME", `${domain}\n`);
else if (existsSync(p("public/CNAME"))) {
  rmSync(p("public/CNAME"));
  written.push("public/CNAME (removed)");
}

const run = (script, ...a) => {
  const r = spawnSync(process.execPath, [p(script), ...a], { cwd: root, encoding: "utf8" });
  process.stdout.write(r.stdout);
  if (r.status !== 0) {
    process.stderr.write(r.stderr);
    console.error(`new-shop: ${script} failed`);
    process.exit(1);
  }
};
run("scripts/sync-slots.mjs");
run("scripts/lib/export-public-text.mjs");
if (!skipImages) run("scripts/make-og.mjs");
run("scripts/check-template.mjs");

const site = domain ? `https://${domain}` : `https://gumon-tech.github.io/shop-site-${shopId}`;
console.log(`
new-shop: wrote ${written.join(", ")}
Site address once Pages is on: ${site}/  (build.json: ${site}/build.json)
Next (TEMPLATE.md has the detail):
  1. Read and adjust content/*.md with the shop (words, booking terms, privacy notice); add content/treatments/<slug>.md
     for treatments that need their own page (start from examples/treatment.md) and run node scripts/sync-slots.mjs.
  2. Replace the placeholder photos in public/img/ if the shop has its own (same file names and sizes).
  3. npm run check   (everything must pass), commit, push to main.
  4. Settings > Pages > Source: GitHub Actions${domain ? `; custom domain ${domain} (DNS first)` : ""}.
  5. In the bot's shops/${shopId}/shop.json set web.site_repo "gumon-tech/shop-site-${shopId}", web.site_url "${site}".`);
