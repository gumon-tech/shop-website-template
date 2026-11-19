// data/brand.json -> CSS custom properties ("R G B" channels) for tailwind.config.ts and app/globals.css.
import brandFile from "@/data/brand.json";

const KEYS = ["primary", "primary_deep", "primary_mid", "primary_tint", "accent", "accent_pale", "accent_deep", "cream", "sand", "stone", "ink", "ink_2"] as const;
type Key = (typeof KEYS)[number];

interface Brand {
  colors: Record<Key, string>;
  /** Logo files under public/ ({"header": "/logo/header.webp", "header_w": 69, "header_h": 96, "footer": ...}) or null for none. */
  logo: { header: string; header_w: number; header_h: number; footer?: string; footer_w?: number; footer_h?: number } | null;
  /** Two-line wordmark for the header; null splits the shop name. */
  wordmark: { line1: string; line2: string } | null;
}

export const BRAND = brandFile as unknown as Brand;

function channels(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`data/brand.json: "${hex}" is not a #RRGGBB colour`);
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** ":root{--c-primary:91 30 112;...}" */
export function brandCss(): string {
  return `:root{${KEYS.map((k) => `--c-${k.replace(/_/g, "-")}:${channels(BRAND.colors[k])}`).join(";")}}`;
}

export const THEME_COLOR = BRAND.colors.primary;
