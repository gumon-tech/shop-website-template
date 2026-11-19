// Runs after `next build`. Fails the build (exit 1) on any problem in out/.
// Plain Node, no dependencies. Keep its route list independent of lib/routes.ts on purpose:
// a route dropped from the app by mistake should fail here, not vanish from both lists.
// Paths are compared with "/" on every platform (Windows too).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findMetadata } from "./lib/image-metadata.mjs";
import { siteConfig } from "./lib/site-config.mjs";
import { NEVER_WORDS, OLD_NUMBER_FRAGMENTS, SHORT_NAME } from "./lib/public-text.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "out");
const errors = [];
const fail = (msg) => errors.push(msg);
const slash = (p) => p.split(path.sep).join("/");

const read = (p) => readFileSync(p, "utf8");
const jsonOf = (name) => JSON.parse(read(path.join(root, "data", `${name}.json`)));
const shop = jsonOf("shop");
const business = jsonOf("business");
const indexable = business.indexable === true;
const deposit = typeof business.deposit_gbp === "number" ? business.deposit_gbp : null;
const WA_NUMBER = business.whatsapp ? String(business.whatsapp).replace(/\D/g, "") : null;
const BUSINESS_TYPE = business.business_type || "LocalBusiness";
const { basePath: BASE, url: SITE_URL, cname: CNAME } = siteConfig(root);

const data = jsonOf("services");
const rows = data.services;
const slugs = [...new Set(rows.map((r) => r.slug))];
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
const article = (name) => (/^[aeiou]/i.test(name) ? "an" : "a");
const shopToday = new Intl.DateTimeFormat("en-CA", { timeZone: shop.timezone || "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

if (!existsSync(OUT)) {
  console.error("out/ does not exist: run next build first");
  process.exit(1);
}

// ---- routes -----------------------------------------------------------------
const routes = ["/", "/treatments/", "/gift-vouchers/", "/about/", "/visit/", "/faq/", "/careers/", "/privacy/", ...slugs.map((s) => `/treatments/${s}/`)];
const fileFor = (route) => path.join(OUT, route, "index.html");
for (const r of routes) if (!existsSync(fileFor(r))) fail(`missing page: ${r}`);
for (const f of ["404.html", "robots.txt", "sitemap.xml"]) if (!existsSync(path.join(OUT, f))) fail(`missing out/${f}`);

// ---- CNAME: out/CNAME is public/CNAME (a custom domain), or absent (served at <owner>.github.io/<repo>/) --------------
{
  const out = path.join(OUT, "CNAME");
  if (CNAME && (!existsSync(out) || read(out).trim() !== CNAME)) fail(`out/CNAME should be "${CNAME}" (public/CNAME)`);
  if (!CNAME && existsSync(out)) fail("out/CNAME exists but public/CNAME does not");
}

// ---- walk out/ --------------------------------------------------------------
const files = [];
(function walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(OUT);

const TEXT = /\.(html|txt|xml|js|css|json|map|webmanifest|svg)$/;
for (const f of files) {
  if (!TEXT.test(f)) continue;
  const t = read(f);
  for (const frag of OLD_NUMBER_FRAGMENTS) if (t.includes(frag)) fail(`${slash(path.relative(OUT, f))} contains a phone number the shop no longer uses (${frag}, data/text-rules.json)`);
}

// ---- robots.txt and sitemap -------------------------------------------------
if (existsSync(path.join(OUT, "robots.txt"))) {
  const r = read(path.join(OUT, "robots.txt"));
  if (!indexable) {
    if (!/^Disallow:\s*\/\s*$/m.test(r)) fail("robots.txt must Disallow: / while indexable=false");
    if (/^Allow:/m.test(r) || /^Sitemap:/im.test(r)) fail("robots.txt must not Allow or list a Sitemap while indexable=false");
  } else {
    if (!/^Allow:\s*\//m.test(r)) fail("robots.txt must Allow: / when indexable=true");
    if (!r.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) fail("robots.txt must reference the sitemap when indexable=true");
  }
}
if (existsSync(path.join(OUT, "sitemap.xml"))) {
  const s = read(path.join(OUT, "sitemap.xml"));
  for (const r of routes) if (!s.includes(`<loc>${SITE_URL}${r}</loc>`)) fail(`sitemap.xml lacks ${r}`);
}

// ---- per-page checks --------------------------------------------------------
const EMOJI = /\p{Extended_Pictographic}/u;
const decodeEntities = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const stripTags = (s) => decodeEntities(s.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const visible = (html) => stripTags(html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, ""));
const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return m ? decodeEntities(m[1]) : undefined;
};
const ldOf = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

const htmlFiles = files.filter((f) => f.endsWith(".html"));
const pageFiles = new Map(); // "treatments/index.html" -> html
for (const f of htmlFiles) pageFiles.set(slash(path.relative(OUT, f)), read(f));
const pageOf = (route) => pageFiles.get(route === "/" ? "index.html" : `${route.slice(1)}index.html`);
const is404 = (rel) => rel === "404.html" || rel === "404/index.html" || rel === "_not-found/index.html" || rel === "_not-found.html";

/** A site path ("/img/x.webp", "/about/") without the base path, or null when an internal reference lacks the base path. */
const unbase = (ref) => {
  if (!BASE) return ref;
  if (ref === BASE || ref.startsWith(`${BASE}/`)) return ref.slice(BASE.length) || "/";
  return null;
};
const internalExists = (ref) => {
  const clean = ref.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return true;
  const p = path.join(OUT, clean);
  return existsSync(p) && (statSync(p).isFile() || existsSync(path.join(p, "index.html")));
};

for (const [rel, html] of pageFiles) {
  const nf = is404(rel);
  const where = rel;

  const title = /<title>([\s\S]*?)<\/title>/.exec(html)?.[1];
  if (!title || !title.trim()) fail(`${where}: no <title>`);
  const desc = /<meta name="description" content="([^"]*)"/.exec(html)?.[1];
  if (!nf && (!desc || !desc.trim())) fail(`${where}: no meta description`);

  const robots = /<meta name="robots" content="([^"]*)"/.exec(html)?.[1] ?? "";
  if (!indexable || nf) {
    if (!/noindex/.test(robots)) fail(`${where}: robots meta lacks noindex (indexable=${indexable})`);
  } else if (/noindex/.test(robots)) fail(`${where}: robots meta says noindex but indexable=true`);
  if (!indexable && !nf && !/nofollow/.test(robots)) fail(`${where}: robots meta lacks nofollow`);

  if (!nf) {
    const canon = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1];
    const expected = `${SITE_URL}${rel === "index.html" ? "/" : "/" + rel.replace(/index\.html$/, "")}`;
    if (canon !== expected) fail(`${where}: canonical is ${canon}, expected ${expected}`);
    for (const p of ["og:title", "og:description", "og:image", "og:url"]) {
      if (!html.includes(`property="${p}"`)) fail(`${where}: missing ${p}`);
    }
    if (!html.includes('name="twitter:card"')) fail(`${where}: missing twitter:card`);
  }

  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) fail(`${where}: ${h1s} h1 elements, expected 1`);
  if (!/<main[\s>]/.test(html) || !/<header[\s>]/.test(html) || !/<footer[\s>]/.test(html)) fail(`${where}: missing a landmark (header/main/footer)`);
  if (!html.includes('class="skip-link"')) fail(`${where}: missing skip link`);

  const emoji = html.replace(/[©®™]/g, "").match(EMOJI);
  if (emoji) fail(`${where}: emoji character ${JSON.stringify(emoji[0])}`);

  // Nothing unfilled and no empty fact reaches the page.
  const text = visible(html);
  if (/\{\{|\}\}/.test(text)) fail(`${where}: an unfilled {{placeholder}} is visible`);
  if (/\b(?:undefined|null|NaN)\b/.test(text)) fail(`${where}: "undefined", "null" or "NaN" is visible`);
  if (/href="(?:tel:|mailto:)?"/.test(html)) fail(`${where}: an empty tel:, mailto: or href`);

  // JSON-LD
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const s = JSON.stringify(JSON.parse(m[1]));
      if (/aggregateRating|"review"/.test(s)) fail(`${where}: JSON-LD has aggregateRating or review`);
      if (/:null\b/.test(s)) fail(`${where}: JSON-LD carries a null value`);
    } catch (e) {
      fail(`${where}: JSON-LD does not parse (${e.message})`);
    }
  }

  // images
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const t = m[0];
    if (attr(t, "alt") === undefined) fail(`${where}: <img> without alt: ${t.slice(0, 80)}`);
    if (!attr(t, "width") || !attr(t, "height")) fail(`${where}: <img> without width/height: ${attr(t, "src")}`);
  }

  // internal references exist, under the base path
  for (const m of html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
    const ref = decodeEntities(m[1]);
    if (ref.startsWith("//")) continue;
    const local = unbase(ref);
    if (local === null) {
      fail(`${where}: internal reference ${ref} lacks the base path ${BASE}`);
      continue;
    }
    if (local.startsWith("/_next/")) continue;
    if (!internalExists(local)) fail(`${where}: broken internal reference ${ref}`);
  }
  for (const m of html.matchAll(/srcSet="([^"]+)"|srcset="([^"]+)"/g)) {
    for (const part of (m[1] ?? m[2]).split(",")) {
      const u = decodeEntities(part.trim().split(/\s+/)[0]);
      const local = unbase(u);
      if (local === null) fail(`${where}: srcset file ${u} lacks the base path ${BASE}`);
      else if (!internalExists(local)) fail(`${where}: srcset file ${u} does not exist`);
    }
  }

  // WhatsApp links
  for (const m of html.matchAll(/<a\b[^>]*>/g)) {
    const tag = m[0];
    const href = attr(tag, "href");
    if (!href || !href.includes("wa.me")) continue;
    if (!WA_NUMBER) {
      fail(`${where}: a wa.me link while data/business.json has no whatsapp number`);
      continue;
    }
    let u;
    try {
      u = new URL(href);
    } catch {
      fail(`${where}: unparsable wa.me link ${href}`);
      continue;
    }
    if (u.hostname !== "wa.me" || u.pathname !== `/${WA_NUMBER}`) fail(`${where}: wa.me link to wrong number: ${href}`);
    const t = u.searchParams.get("text") ?? "";
    if (!/ \[web-[A-Z]{1,2}\]$/.test(t)) fail(`${where}: wa.me text lacks a [web-X] tag: ${t}`);
    if (attr(tag, "target") !== "_blank" || !/noopener/.test(attr(tag, "rel") ?? "")) fail(`${where}: wa.me link without target=_blank rel=noopener`);
  }
  for (const m of html.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)) {
    if (/google\.com\/maps\/embed/.test(m[1])) fail(`${where}: external embed ${m[1]}`);
  }
  if (/<iframe/.test(html)) fail(`${where}: contains an iframe`);
}

// ---- prices on the menu -----------------------------------------------------
function optionAnchors(html) {
  return [...html.matchAll(/<a\b[^>]*class="opt"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => {
    const label = stripTags(m[1]);
    const href = attr(m[0], "href") ?? "";
    const text = href ? new URL(href).searchParams.get("text") ?? "" : "";
    const pm = /^(.*) · £(\d+(?:\.\d+)?)$/.exec(label);
    return { label, option: pm?.[1], price: pm?.[2], text };
  });
}

const menuHtml = pageOf("/treatments/");
if (menuHtml && WA_NUMBER) {
  const got = optionAnchors(menuHtml);
  if (got.length !== rows.length) fail(`/treatments/: ${got.length} option buttons, expected ${rows.length}`);
  rows.forEach((r, i) => {
    const g = got[i];
    if (!g) return;
    if (g.option !== r.option || g.price !== fmt(r.price_gbp)) fail(`/treatments/: row ${i} is "${g.label}", expected "${r.option} · £${fmt(r.price_gbp)}"`);
    const want = `Hi ${shop.name}, I'd like to book ${article(r.name)} ${r.name} (${r.option}) please. [web-M]`;
    if (g.text !== want) fail(`/treatments/: row ${i} message is "${g.text}", expected "${want}"`);
  });
}
if (menuHtml) {
  // Any £ amount on the page must be a menu price or the deposit.
  const prices = new Set(rows.map((r) => fmt(r.price_gbp)));
  for (const m of visible(menuHtml).matchAll(/£(\d+(?:\.\d+)?)/g)) {
    if (deposit !== null && Number(m[1]) === deposit) continue;
    if (!prices.has(m[1])) fail(`/treatments/: stray price £${m[1]} not in services.json`);
  }
}

for (const slug of slugs) {
  const html = pageOf(`/treatments/${slug}/`);
  if (!html) continue;
  const mine = rows.filter((r) => r.slug === slug);
  if (WA_NUMBER) {
    const got = optionAnchors(html);
    if (got.length !== mine.length) fail(`/treatments/${slug}/: ${got.length} option buttons, expected ${mine.length}`);
    mine.forEach((r, i) => {
      const g = got[i];
      if (!g) return;
      if (g.option !== r.option || g.price !== fmt(r.price_gbp)) fail(`/treatments/${slug}/: "${g.label}" differs from data`);
      if (!g.text.includes(`${r.name} (${r.option})`)) fail(`/treatments/${slug}/: option message lacks "${r.name} (${r.option})"`);
    });
    const tags = new Set(got.map((g) => /\[web-([A-Z]{1,2})\]$/.exec(g.text)?.[1]));
    if (tags.size !== 1) fail(`/treatments/${slug}/: option buttons use ${tags.size} different tags`);
  }
  const ld = ldOf(html);
  const svc = ld.find((j) => j["@type"] === "Service");
  if (!svc) fail(`/treatments/${slug}/: no Service JSON-LD`);
  else {
    const prices = svc.offers.map((o) => o.price).join();
    const want = mine.map((r) => r.price_gbp.toFixed(2)).join();
    if (prices !== want) fail(`/treatments/${slug}/: JSON-LD prices ${prices} differ from data ${want}`);
  }
  if (!ld.some((j) => j["@type"] === "BreadcrumbList")) fail(`/treatments/${slug}/: no BreadcrumbList JSON-LD`);
}

const faqHtml = pageOf("/faq/");
if (faqHtml && !/"@type":"FAQPage"/.test(faqHtml)) fail("/faq/: no FAQPage JSON-LD");
const homeHtml = pageOf("/");
if (homeHtml && !ldOf(homeHtml).some((j) => j["@type"] === BUSINESS_TYPE)) fail(`/: no ${BUSINESS_TYPE} JSON-LD`);

// ---- promotions (data/promotions.json, written by the shop's WhatsApp system) ----
// What the home page shows must be exactly the offers that are live today in the shop's timezone: nothing ended,
// nothing that has not started, and no #promotions section at all when there are none.
{
  const file = jsonOf("promotions");
  const shown = file.promotions.filter((p) => p.status === "live" && p.starts <= shopToday && shopToday <= p.ends);
  const htmlCodes = homeHtml ? [...homeHtml.matchAll(/data-promo="([^"]+)"/g)].map((m) => m[1]) : [];
  const want = shown.map((p) => p.code).sort().join();
  if (htmlCodes.slice().sort().join() !== want) fail(`/: offers in the page [${htmlCodes.sort()}] differ from the offers live on ${shopToday} [${want}]`);
  const hasSection = homeHtml ? /<section[^>]*\sid="promotions"/.test(homeHtml) : false;
  if (shown.length && !hasSection) fail('/: offers are live but the page has no id="promotions" section');
  if (!shown.length && hasSection) fail('/: id="promotions" section present while no offer is live');
  for (const [rel, html] of pageFiles) {
    if (rel !== "index.html" && /data-promo="|id="promotions"/.test(html)) fail(`${rel}: offer markup outside the home page`);
  }
  for (const p of shown) {
    const from = (homeHtml ?? "").indexOf(`data-promo="${p.code}"`);
    const rest = from < 0 ? "" : homeHtml.slice(from + 12);
    const nextCard = rest.indexOf('data-promo="');
    const card = rest.slice(0, nextCard >= 0 ? nextCard : Math.max(rest.indexOf("</section>"), 0));
    if (WA_NUMBER) {
      const href = attr(/<a\b[^>]*wa\.me[^>]*>/.exec(card)?.[0] ?? "", "href");
      const text = href ? new URL(href).searchParams.get("text") : null;
      if (text !== `${p.message.trim()} [web-PR]`) fail(`/: offer ${p.code} button message is ${JSON.stringify(text)}, expected its message plus [web-PR]`);
    }
    if (!card.includes(p.ends_label)) fail(`/: offer ${p.code} does not show its end date "${p.ends_label}"`);
  }
}

// ---- hours, closures, notice, extra FAQ, photos (written by the shop system; design: README "Data the shop system writes") ----
{
  const addDays = (day, n) => {
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // hours: the /visit/ table and the business JSON-LD say what data/hours.json says; no table while no day has hours.
  const hours = jsonOf("hours").hours;
  const hasHours = DAYS.some((d) => hours[d]);
  const visitHtml = pageOf("/visit/") ?? "";
  const tableRows = [...visitHtml.matchAll(/<tr[^>]*><th[^>]*>([^<]*)<\/th><td[^>]*>([^<]*)<\/td><\/tr>/g)].map((m) => [decodeEntities(m[1]).trim(), decodeEntities(m[2]).trim()]);
  const wantRows = hasHours ? DAYS.map((d) => [d, hours[d] ? `${hours[d].opens}–${hours[d].closes}` : "Closed"]) : [];
  if (JSON.stringify(tableRows) !== JSON.stringify(wantRows)) fail(`/visit/: hours table ${JSON.stringify(tableRows)} differs from data/hours.json ${JSON.stringify(wantRows)}`);
  if (homeHtml) {
    const biz = ldOf(homeHtml).find((j) => j["@type"] === BUSINESS_TYPE);
    const got = {};
    for (const spec of biz?.openingHoursSpecification ?? []) for (const d of spec.dayOfWeek) got[d] = `${spec.opens}-${spec.closes}`;
    const want = Object.fromEntries(DAYS.filter((d) => hours[d]).map((d) => [d, `${hours[d].opens}-${hours[d].closes}`]));
    const sorted = (o) => JSON.stringify(DAYS.filter((d) => d in o).map((d) => [d, o[d]]));
    if (sorted(got) !== sorted(want)) fail(`/: ${BUSINESS_TYPE} openingHoursSpecification ${JSON.stringify(got)} differs from data/hours.json`);
  }

  // closures: live, not over, starting within 60 days: in the footer of every page and under the /visit/ table; every live one not over in JSON-LD.
  const closures = jsonOf("closures").closures.filter((c) => c.status === "live" && c.to >= shopToday);
  const shownCodes = closures.filter((c) => c.from <= addDays(shopToday, 60)).map((c) => c.code).sort().join();
  const specWant = closures.map((c) => `${c.from}|${c.to}|${c.hours ? c.hours.opens : "00:00"}|${c.hours ? c.hours.closes : "00:00"}`).sort().join();
  for (const [rel, html] of pageFiles) {
    if (is404(rel)) continue;
    const foot = [...html.matchAll(/data-closure-foot="([^"]+)"/g)].map((m) => m[1]).sort().join();
    if (foot !== shownCodes) fail(`${rel}: footer closures [${foot}] differ from the live closures [${shownCodes}]`);
    const rowsHere = [...html.matchAll(/data-closure-row="([^"]+)"/g)].map((m) => m[1]).sort().join();
    if (rel === "visit/index.html") {
      if (rowsHere !== shownCodes) fail(`/visit/: closures under the table [${rowsHere}] differ from the live closures [${shownCodes}]`);
      if (shownCodes && !/id="closures"/.test(html)) fail('/visit/: closures are live but there is no id="closures" list');
      if (!shownCodes && /id="closures"/.test(html)) fail('/visit/: id="closures" present while no closure is live');
    } else if (rowsHere) fail(`${rel}: closure rows outside /visit/`);
    for (const j of ldOf(html)) {
      if (j["@type"] !== BUSINESS_TYPE) continue;
      const got = (j.specialOpeningHoursSpecification ?? []).map((x) => `${x.validFrom}|${x.validThrough}|${x.opens}|${x.closes}`).sort().join();
      if (got !== specWant) fail(`${rel}: specialOpeningHoursSpecification [${got}] differs from the live closures [${specWant}]`);
    }
  }
  const hoursAnswer = /What are your opening hours\?[\s\S]*?<\/p>/.exec(faqHtml ?? "")?.[0] ?? "";
  if (hasHours && closures.some((c) => c.from <= addDays(shopToday, 60)) !== /Please note:/.test(hoursAnswer)) fail('/faq/: the hours answer carries "Please note:" iff a closure is upcoming');
  if (!hasHours && hoursAnswer) fail("/faq/: the opening hours question is shown while data/hours.json has no open day");

  // notice: id="notice" on every page iff a notice is live today, with its exact text.
  const notice = jsonOf("notice").notice;
  const noticeLive = notice && notice.status === "live" && notice.starts <= shopToday && shopToday <= notice.ends;
  for (const [rel, html] of pageFiles) {
    const has = /id="notice"/.test(html);
    if (noticeLive && !has) fail(`${rel}: a notice is live but the page has no id="notice" band`);
    if (!noticeLive && has) fail(`${rel}: id="notice" band present while no notice is live`);
    if (noticeLive && has) {
      const band = /<div id="notice"[\s\S]*?<\/p><\/div>/.exec(html)?.[0] ?? "";
      if (!stripTags(band).includes(notice.text)) fail(`${rel}: notice band does not carry the text of ${notice.code}`);
    }
  }

  // extra FAQ: every live question in the page and in the FAQPage JSON-LD; nothing hidden anywhere.
  const faq = jsonOf("faq-extra").questions;
  if (faqHtml) {
    const faqLd = ldOf(faqHtml).find((j) => j["@type"] === "FAQPage");
    const asked = new Set((faqLd?.mainEntity ?? []).map((q) => q.name));
    const text = visible(faqHtml);
    for (const q of faq) {
      const live = q.status === "live";
      if (live && !(asked.has(q.question) && text.includes(q.question) && text.includes(q.answer))) fail(`/faq/: live question ${q.code} missing from the page or the FAQPage JSON-LD`);
      if (!live && (asked.has(q.question) || text.includes(q.answer))) fail(`/faq/: hidden question ${q.code} is shown`);
    }
    if (faq.some((q) => q.status === "live") !== /id="more-questions"/.test(faqHtml)) fail('/faq/: id="more-questions" group present iff an extra question is live');
  }

  // photos: a slot's photo is on the site; a retired photo is nowhere in it.
  const photos = jsonOf("photos");
  const allHtml = [...pageFiles.values()].join("\n");
  for (const im of photos.images) {
    const used = Object.values(photos.slots).includes(im.key);
    const shown = allHtml.includes(`/img/${im.key}-800.webp`);
    if (used && !shown) fail(`photo ${im.key} is set in a slot but no page shows it`);
    if (!used && shown) fail(`photo ${im.key} is shown but no slot uses it`);
  }

  // build.json: the deploy marker (scripts/write-build-json.mjs), not in the sitemap.
  const bj = path.join(OUT, "build.json");
  if (!existsSync(bj)) fail("out/build.json is missing: run node scripts/write-build-json.mjs after next build");
  else {
    try {
      const b = JSON.parse(read(bj));
      if (typeof b.sha !== "string" || !b.sha || typeof b.built_at !== "string" || Number.isNaN(Date.parse(b.built_at))) fail("out/build.json needs sha and built_at");
      for (const c of ["promotions", "hours", "closures", "notice", "faq-extra", "photos", "services", "copy", "seo"]) if (!/^[0-9a-f]{64}$/.test(b.data?.[c] ?? "")) fail(`out/build.json: data.${c} is not a sha256`);
    } catch (e) {
      fail(`out/build.json does not parse (${e.message})`);
    }
    if (existsSync(path.join(OUT, "sitemap.xml")) && read(path.join(OUT, "sitemap.xml")).includes("build.json")) fail("sitemap.xml lists build.json");
  }
}

// ---- the shop's own wording rules (data/text-rules.json): a short form of the name, words never used --------------------
{
  const metaContent = (html, key, val) => new RegExp(`<meta ${key}="${val}" content="([^"]*)"`).exec(html)?.[1] ?? "";
  for (const [rel, html] of pageFiles) {
    const noScripts = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
    const waTexts = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]*)"/g)].map((m) => {
      try {
        return new URL(decodeEntities(m[1])).searchParams.get("text") ?? "";
      } catch {
        return "";
      }
    });
    const parts = {
      "visible text": stripTags(noScripts),
      "<title>": /<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "",
      "meta description": metaContent(html, "name", "description"),
      "og:title": metaContent(html, "property", "og:title"),
      "og:description": metaContent(html, "property", "og:description"),
      "alt/aria text": [...noScripts.matchAll(/\b(?:alt|aria-label)="([^"]*)"/g)].map((m) => m[1]).join(" | "),
      "wa.me text=": waTexts.join(" | "),
    };
    for (const [what, text] of Object.entries(parts)) {
      const t = decodeEntities(text);
      if (SHORT_NAME.test(t)) fail(`${rel}: ${what} uses the short form of the shop's name (always "${shop.name}", data/text-rules.json)`);
      if (NEVER_WORDS.test(t)) fail(`${rel}: ${what} has a word this shop never uses (data/text-rules.json)`);
    }
  }
}

// ---- photos shipped in public/img: no EXIF, XMP or GPS (a camera's location must not be published) ----------------------
for (const n of readdirSync(path.join(root, "public", "img"))) {
  const f = path.join(root, "public", "img", n);
  if (!/\.(webp|jpe?g|avif)$/i.test(n) || statSync(f).isDirectory()) continue;
  for (const m of findMetadata(readFileSync(f))) fail(`public/img/${n} carries metadata (${m}): strip it`);
}

// ---- copy and seo (data/copy.json, data/seo.json, written by the shop system; README "copy" and "seo") ---------------------
// Every set text slot is on its page and every set title/description is the page's.
{
  const seoPages = JSON.parse(read(path.join(root, "scripts/lib/seo-pages.json"))).pages;
  const routeOf = Object.fromEntries(Object.entries(seoPages).map(([r, f]) => [f, r]));
  const slots = JSON.parse(read(path.join(root, "scripts/lib/copy-slots.json"))).slots;
  const copy = jsonOf("copy").slots;
  for (const [key, value] of Object.entries(copy)) {
    if (value === null) continue;
    const route = routeOf[slots[key]?.file];
    const html = route && pageOf(route);
    if (!html) fail(`copy slot ${key}: no page for ${slots[key]?.file}`);
    else if (!visible(html).includes(value)) fail(`copy slot ${key}: its text is not on ${route}`);
  }
  const seo = jsonOf("seo").pages;
  for (const [route, o] of Object.entries(seo)) {
    const html = pageOf(route);
    if (!html) {
      fail(`seo: no page ${route}`);
      continue;
    }
    const title = decodeEntities(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "");
    const desc = decodeEntities(/<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? "");
    if (o.title !== null && title !== o.title) fail(`seo ${route}: <title> is "${title}", data/seo.json says "${o.title}"`);
    if (o.description !== null && desc !== o.description) fail(`seo ${route}: meta description differs from data/seo.json`);
  }
}

// ---- result -----------------------------------------------------------------
if (errors.length) {
  console.error(`check-site: ${errors.length} problem(s)\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log(`check-site OK: ${pageFiles.size} html files, ${routes.length} routes, base path "${BASE}", url ${SITE_URL}, indexable=${indexable}`);
