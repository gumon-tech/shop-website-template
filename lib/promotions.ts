// Types and date rules for data/promotions.json. No file access here, so a
// client component can import it. The shop's WhatsApp system writes the file
// (README, "Promotions"); the schema is the one it writes. scripts/validate-promotions.mjs
// holds the same rules for the build.
import shop from "@/data/shop.json";

const SHOP_TZ: string = (shop as { timezone?: string }).timezone || "Europe/London";

export interface Promotion {
  code: string;
  title: string;
  eyebrow: string;
  detail: string;
  points: string[];
  offer: string;
  /** Pre-filled WhatsApp text. The site adds the [web-PR] tag itself. */
  message: string;
  /** Always null for offers the system writes; a path under /img/ otherwise. */
  image: string | null;
  illustrative: boolean;
  /** YYYY-MM-DD, shop time. Shown from the start of this day. */
  starts: string;
  /** YYYY-MM-DD, shop time. Shown until the end of this day. */
  ends: string;
  ends_label: string;
  status: "live" | "ended" | "draft";
}

export interface PromotionsFile {
  updated_at: string;
  note?: string;
  promotions: Promotion[];
}

/** Today's date in the shop's timezone (data/shop.json) as YYYY-MM-DD. */
export function shopDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Shown on `day`: status live, started, and not past its last day. Ended offers never show. */
export function isShownOn(p: Pick<Promotion, "status" | "starts" | "ends">, day: string): boolean {
  return p.status === "live" && p.starts <= day && day <= p.ends;
}
