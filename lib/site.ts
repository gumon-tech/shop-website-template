// The one place the shop's facts live. Identity (name, timezone, locale) comes from data/shop.json (written by scripts/new-shop.mjs when the
// team builds the first site); everything else from data/business.json, where null means "not known yet" and the parts of the site
// that need it are hidden. Hours come from data/hours.json via lib/hours-text.ts. Where the site is served (base path and
// absolute URL) comes from next.config.mjs (scripts/lib/site-config.mjs).
import shopFile from "@/data/shop.json";
import businessFile from "@/data/business.json";
import hoursFile from "@/data/hours.json";
import { DAYS, hoursCompactLines, hoursText, type Day, type WeekHours } from "@/lib/hours-text";

interface Address {
  street: string;
  locality: string;
  region?: string | null;
  postal_code: string;
  country?: string | null;
}
interface Business {
  tagline: string | null;
  address: Address | null;
  geo: { latitude: number; longitude: number } | null;
  phone: { display: string; e164: string } | null;
  whatsapp: string | null;
  email: string | null;
  maps_url: string | null;
  deposit_gbp: number | null;
  indexable: boolean;
  business_type: string | null;
  area_served: string | null;
  payment_accepted: string | null;
  privacy_updated: string | null;
  treatment_tags: Record<string, string>;
}
interface Shop {
  shopId: string;
  name: string;
  country: string;
  timezone: string;
  locale: string;
}

const shop = shopFile as Shop;
const biz = businessFile as unknown as Business;
const addr = biz.address;

/** "" on a custom domain, "/<repo>" on <owner>.github.io/<repo>/. next/link adds it by itself; raw src/href use asset(). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** A file under public/ as the browser must request it (with the base path). */
export function asset(p: string): string {
  return `${BASE_PATH}${p.startsWith("/") ? p : `/${p}`}`;
}

export const SITE = {
  /**
   * ONE switch (data/business.json "indexable"). false: every page carries noindex, nofollow and robots.txt disallows
   * everything. true: pages are indexable, robots.txt allows crawling and points at the sitemap.
   */
  indexable: biz.indexable === true,
  /** Absolute URL of the site root, including the base path, without a trailing slash. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  shopId: shop.shopId,
  name: shop.name,
  country: shop.country,
  timezone: shop.timezone || "Europe/London",
  locale: shop.locale || "en-GB",
  tagline: biz.tagline,
  streetAddress: addr?.street ?? null,
  locality: addr?.locality ?? null,
  region: addr?.region ?? null,
  postalCode: addr?.postal_code ?? null,
  addressCountry: addr?.country ?? shop.country,
  /** Rendered everywhere the address is shown in one line; null hides it. */
  address: addr ? [addr.street, `${addr.locality} ${addr.postal_code}`.trim()].filter(Boolean).join(", ") : null,
  geo: biz.geo,
  phoneDisplay: biz.phone?.display ?? null,
  phoneE164: biz.phone?.e164 ?? null,
  /** wa.me wants digits only; null hides every WhatsApp button. */
  whatsappNumber: biz.whatsapp ? biz.whatsapp.replace(/\D/g, "") : null,
  email: biz.email,
  mapsUrl: biz.maps_url,
  /** Pounds, rendered "£15" via DEPOSIT_LABEL; null: the shop takes no deposit (the terms must not mention one). */
  depositGbp: biz.deposit_gbp,
  /** Date the privacy notice text last changed; null hides the line. */
  privacyUpdated: biz.privacy_updated,
  businessType: biz.business_type || "LocalBusiness",
  areaServed: biz.area_served,
  paymentAccepted: biz.payment_accepted,
  treatmentTags: biz.treatment_tags ?? {},
  /** Shown in the footer legal line. */
  builtBy: "Gumon Technology",
  /** builtBy in the footer links here. */
  builtByUrl: "https://gumon.io",
} as const;

export const DEPOSIT_LABEL: string | null = SITE.depositGbp === null || SITE.depositGbp === undefined ? null : `£${SITE.depositGbp}`;

export { DAYS };
export type { Day };

/** Open/close per day; null means closed. From data/hours.json (written by the shop system, validated by scripts/validate-hours.mjs). */
export const HOURS: WeekHours = (hoursFile as { hours: WeekHours }).hours;

/** False while no day has hours (a new shop): every hours display is hidden. */
export const HAS_HOURS: boolean = DAYS.some((d) => HOURS[d] !== null);

/** "Open Tuesday to Sunday, 11:00 to 19:00. Closed on Mondays." Rules and examples: README, "The sentences". null: no hours yet. */
export function hoursSentence(): string | null {
  return HAS_HOURS ? hoursText(HOURS) : null;
}

/** Footer lines: "Mon Closed", "Tue–Sun 11:00–19:00". Empty while no hours are set. */
export function hoursCompact(): string[] {
  return HAS_HOURS ? hoursCompactLines(HOURS) : [];
}

export function absoluteUrl(path: string): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
