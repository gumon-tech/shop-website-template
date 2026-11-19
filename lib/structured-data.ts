// JSON-LD builders. Facts come from lib/site.ts (null facts are left out) and prices from data/services.json only.
// No aggregateRating and no review: the site quotes no reviews.
import { DAYS, HOURS, SITE, absoluteUrl } from "@/lib/site";
import { closuresForStructuredData } from "@/lib/closures-data";
import { GROUPS, SERVICE_ROWS, formatPrice, type Treatment } from "@/lib/services";

const BUSINESS_ID = `${SITE.url}/#business`;

function priceRange(): string | undefined {
  const prices = SERVICE_ROWS.map((r) => r.price_gbp);
  if (!prices.length) return undefined;
  return `£${formatPrice(Math.min(...prices))}–£${formatPrice(Math.max(...prices))}`;
}

/** Drops keys whose value is null, undefined or an empty list, so JSON-LD never carries a fact the shop has not given. */
function compact<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0))) as T;
}

function openingHours() {
  // Group days that share the same hours into one specification.
  const groups = new Map<string, string[]>();
  for (const d of DAYS) {
    const h = HOURS[d];
    if (!h) continue;
    const key = `${h.opens}-${h.closes}`;
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }
  return [...groups.entries()].map(([key, days]) => {
    const [opens, closes] = key.split("-");
    return { "@type": "OpeningHoursSpecification", dayOfWeek: days, opens, closes };
  });
}

/** Google's "holiday hours": a closed day is opens 00:00 closes 00:00 (schema.org's way to say closed). */
function specialOpeningHours() {
  return closuresForStructuredData().map((c) => ({
    "@type": "OpeningHoursSpecification",
    validFrom: c.from,
    validThrough: c.to,
    opens: c.hours ? c.hours.opens : "00:00",
    closes: c.hours ? c.hours.closes : "00:00",
  }));
}

export function businessNode(extra: Record<string, unknown> = {}) {
  return compact({
    "@type": SITE.businessType,
    "@id": BUSINESS_ID,
    name: SITE.name,
    url: `${SITE.url}/`,
    image: absoluteUrl("/img/og-1200x630.jpg"),
    telephone: SITE.phoneE164,
    email: SITE.email,
    address: SITE.streetAddress
      ? compact({
          "@type": "PostalAddress",
          streetAddress: SITE.streetAddress,
          addressLocality: SITE.locality,
          addressRegion: SITE.region,
          postalCode: SITE.postalCode,
          addressCountry: SITE.addressCountry,
        })
      : null,
    geo: SITE.geo ? { "@type": "GeoCoordinates", latitude: SITE.geo.latitude, longitude: SITE.geo.longitude } : null,
    hasMap: SITE.mapsUrl,
    openingHoursSpecification: openingHours(),
    ...(closuresForStructuredData().length ? { specialOpeningHoursSpecification: specialOpeningHours() } : {}),
    priceRange: priceRange(),
    paymentAccepted: SITE.paymentAccepted,
    currenciesAccepted: SERVICE_ROWS.length ? "GBP" : null,
    sameAs: SITE.mapsUrl ? [SITE.mapsUrl] : null,
    ...extra,
  });
}

export function businessLd(extra?: Record<string, unknown>) {
  return { "@context": "https://schema.org", ...businessNode(extra) };
}

function offerFor(r: { name: string; option: string; price_gbp: number }) {
  return {
    "@type": "Offer",
    name: `${r.name} (${r.option})`,
    price: r.price_gbp.toFixed(2),
    priceCurrency: "GBP",
    availability: "https://schema.org/InStock",
  };
}

/** /treatments/: the business with an OfferCatalog per group and an Offer per row. */
export function menuLd() {
  return businessLd({
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${SITE.name} treatments`,
      itemListElement: GROUPS.map((g) => ({
        "@type": "OfferCatalog",
        name: g.name,
        itemListElement: g.treatments.flatMap((t) =>
          t.rows.map((r) => ({ ...offerFor(r), itemOffered: { "@type": "Service", name: r.name } })),
        ),
      })),
    },
  });
}

export function serviceLd(t: Treatment, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: t.name,
    serviceType: t.name,
    description,
    url: absoluteUrl(`/treatments/${t.slug}/`),
    provider: { "@type": SITE.businessType, "@id": BUSINESS_ID, name: SITE.name },
    ...(SITE.areaServed ? { areaServed: SITE.areaServed } : {}),
    offers: t.rows.map(offerFor),
  };
}

export function faqLd(pairs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map((p) => ({
      "@type": "Question",
      name: p.q,
      acceptedAnswer: { "@type": "Answer", text: p.a },
    })),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
