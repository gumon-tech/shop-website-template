// The rules every piece of text the shop system writes must pass before it can reach the public site.
// One module, used by validate-promotions.mjs and every other validate-*.mjs. The same lists are exported to
// scripts/lib/public-text.json (node scripts/lib/export-public-text.mjs) so the shop bot can run them before it opens a pull request.
// Plain Node, no dependencies.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const EMOJI = /\p{Extended_Pictographic}/u;
// The public text of this shop is English; the shop system refuses Thai script too.
export const THAI = /[฀-๿]/;
export const LINK = /https?:\/\/|www\./i;
export const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
export const PHONE_LIKE = /(?<![\w])\+?\d[\d\s().-]{7,}\d/;
export const PHONE_MIN_DIGITS = 9;
export const WEB_TAG = /\[web-/i;
// The health and medical claims the UK ASA / CAP code covers for massage (pain, sleep, immunity, tension, recovery,
// conditions, treatment of illness). The site makes none (HANDOFF rules). Same list as HEALTH_CLAIMS in the shop system (website.py).
export const HEALTH = /\b(detox\w*|toxins?|circulation|pain\w*|ache\w*|headache\w*|stress\w*|swell\w*|immun\w*|inflammation|cure\w*|heal\w*|relie\w*|tension|sleep\w*|therap\w*|recover\w*|muscle\w*|well-?being|anxiety|depression|insomnia|arthritis|sciatica|migraines?|fatigue|injur\w*|rehab\w*|alleviat\w*|remed\w*|rheumat\w*|fibromyalgia|eczema|asthma|diabet\w*|cancer|covid|stiff\w*|sore\w*|cramp\w*|spasm\w*|chronic|symptom\w*|diagnos\w*|illness|disease|medical|clinical|physio\w*|chiropract\w*|osteo\w*|blood pressure|joints|posture|knot\w*|back problem\w*|lymph\w*|drainage|weight|slim\w*|digest\w*|energ\w*|hormon\w*|breath\w*|nerve\w*|tight\w*)\b/i;
// No review claims: the site quotes no reviews, ratings or stars (DMCC Act 2024, HANDOFF rules).
export const REVIEW_WORDS = /(\breviews?\b|\breviewed\b|\brated\b|\bratings?\b|\bstars?\b|★|⭐|\b5[- ]?stars?\b|\btestimonials?\b|\btrustpilot\b|\bgoogle reviews?\b)/i;

// Shop-specific rules (data/text-rules.json, a person's change): a short form of the name that must never be used (a JavaScript
// regex, case-sensitive; null for none), words that must never appear (say a neighbouring business) and fragments of an old
// phone number. The template ships none of them.
const NEVER_MATCH = /(?!)/;
function textRules(root = ROOT) {
  const f = path.join(root, "data/text-rules.json");
  const r = existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {};
  const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const words = (r.never_words ?? []).filter((w) => typeof w === "string" && w.trim());
  return {
    shortName: r.short_name ? new RegExp(r.short_name) : NEVER_MATCH,
    neverWords: words.length ? new RegExp(`\\b(?:${words.map(esc).join("|")})\\b`, "i") : NEVER_MATCH,
    oldNumberFragments: (r.old_number_fragments ?? []).filter((x) => typeof x === "string" && x),
  };
}
const RULES = textRules();
export const SHORT_NAME = RULES.shortName;
export const NEVER_WORDS = RULES.neverWords;
export const OLD_NUMBER_FRAGMENTS = RULES.oldNumberFragments;

/** Facts from the repo the rules depend on: service prices, the deposit and the shop's exact display name. */
export function loadFacts(root = ROOT) {
  const services = JSON.parse(readFileSync(path.join(root, "data/services.json"), "utf8")).services;
  const business = JSON.parse(readFileSync(path.join(root, "data/business.json"), "utf8"));
  const shop = JSON.parse(readFileSync(path.join(root, "data/shop.json"), "utf8"));
  return {
    servicePrices: new Set(services.map((s) => s.price_gbp)),
    deposit: typeof business.deposit_gbp === "number" ? business.deposit_gbp : null,
    // The shop's exact display name may use a word the list blocks ("Therapy"); the same exemption as the shop system.
    shopName: typeof shop.name === "string" ? shop.name : "",
  };
}

export const scrubName = (t, shopName) =>
  shopName ? t.split(new RegExp(shopName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")).join(" ") : t;

export const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);
export const isTimestamp = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s);

/** "Monday 30 November 2026" for a YYYY-MM-DD date. */
export const dateLabel = (s) => {
  const d = new Date(`${s}T00:00:00Z`);
  const f = (o) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...o }).format(d);
  return `${f({ weekday: "long" })} ${d.getUTCDate()} ${f({ month: "long" })} ${d.getUTCFullYear()}`;
};

/**
 * Problems in one piece of public text, as short messages (the caller adds where). Empty array = fine.
 * facts: from loadFacts(). options:
 *   money: "discount" (default: a "£5 off" style amount is fine) or "none" (no £ at all)
 *   allowTherapist: alt text may say "therapist" (it describes the photo; the list blocks it as a health word)
 */
export function checkPublicText(t, facts, { money = "discount", allowTherapist = false } = {}) {
  const out = [];
  const head = `"${t.slice(0, 40)}"`;
  if (EMOJI.test(t)) out.push(`emoji in ${head}`);
  if (LINK.test(t)) out.push(`link in ${head} (the only link on a card is the shop's own WhatsApp button)`);
  if (EMAIL.test(t)) out.push(`email address in ${head}`);
  if (PHONE_LIKE.test(t) && t.replace(/\D/g, "").length >= PHONE_MIN_DIGITS) out.push(`phone-like number in ${head}`);
  if (OLD_NUMBER_FRAGMENTS.some((f) => t.includes(f))) out.push("a phone number the shop no longer uses");
  if (WEB_TAG.test(t)) out.push("the [web-X] tag is added by the site, not written in the text");
  if (SHORT_NAME.test(t)) out.push(`the shop's short name in ${head} (always write "${facts.shopName}" in full)`);
  if (NEVER_WORDS.test(t)) out.push(`a word this shop never uses in public text in ${head} (data/text-rules.json)`);
  if (THAI.test(t)) out.push(`Thai script in ${head} (the public text is English)`);
  let healthText = scrubName(t, facts.shopName);
  if (allowTherapist) healthText = healthText.replace(/\btherapists?\b/gi, " ");
  if (HEALTH.test(healthText)) out.push(`health-result wording in ${head} (the site makes no health claims)`);
  if (REVIEW_WORDS.test(t)) out.push(`review or rating wording in ${head} (the site makes no review claims)`);
  // Service prices come only from data/services.json. A discount amount ("£5 off") is fine.
  for (const m of t.matchAll(/£(\d+(?:\.\d+)?)/g)) {
    if (money === "none") {
      out.push(`£${m[1]}: no money amounts in this field`);
      continue;
    }
    const v = Number(m[1]);
    const after = t.slice(m.index + m[0].length, m.index + m[0].length + 24).toLowerCase();
    const before = t.slice(Math.max(0, m.index - 12), m.index).toLowerCase();
    const isDiscount = /^\s*(off|discount|gift voucher|voucher|credit|saving)/.test(after) || /(save|off|take|extra)\s*$/.test(before);
    if (!isDiscount && (facts.deposit === null || v !== facts.deposit) && !facts.servicePrices.has(v)) out.push(`£${m[1]} is neither a discount, the deposit nor a price in services.json`);
  }
  return out;
}

/** Shared helpers for the small validators: collect errors, load JSON, print and exit. */
export function makeReporter(name) {
  const errors = [];
  return {
    fail: (m) => errors.push(m),
    errors,
    finish(okMessage) {
      if (errors.length) {
        console.error(`${name} has problems:\n- ` + errors.join("\n- "));
        process.exit(1);
      }
      console.log(okMessage);
    },
  };
}

export function loadJsonOrExit(file, label) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`${label} is not valid JSON: ${e.message}`);
    process.exit(1);
  }
}

export const isObject = (x) => typeof x === "object" && x !== null && !Array.isArray(x);
