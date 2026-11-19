// Generates the share image and the browser icons from data/shop.json (name), data/business.json (tagline) and
// data/brand.json (colours):
//   public/img/og-1200x630.jpg                     the link preview: the "gift" photo, a brand-colour gradient, the name and tagline
//   public/icon-32.png, icon-192.png, icon-512.png  a brand-colour disc with the shop's first letter
//   public/apple-touch-icon.png
// scripts/new-shop.mjs runs it; run it again after changing the name, tagline or colours.
//   node scripts/make-og.mjs   (sharp is a dev dependency; offline)
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = (rel) => JSON.parse(readFileSync(path.join(root, rel), "utf8"));
const shop = json("data/shop.json");
const business = json("data/business.json");
const { colors } = json("data/brand.json");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const W = 1200;
const H = 630;
const name = shop.name;
const size = name.length > 22 ? 64 : name.length > 14 ? 84 : 104;
const base = await sharp(path.join(root, "public/img/gift-1600.webp")).resize(W, H, { fit: "cover", position: "centre" }).toBuffer();
const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${colors.primary_deep}" stop-opacity="0.96"/>
      <stop offset="0.55" stop-color="${colors.primary_deep}" stop-opacity="0.85"/>
      <stop offset="1" stop-color="${colors.primary_deep}" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="80" y="330" font-family="Cormorant Garamond, Georgia, 'Times New Roman', serif" font-size="${size}" font-weight="600" fill="${colors.cream}">${esc(name)}</text>
  <line x1="84" y1="372" x2="212" y2="372" stroke="${colors.accent}" stroke-width="2"/>
  ${business.tagline ? `<text x="84" y="425" font-family="Helvetica Neue, Arial, sans-serif" font-size="28" fill="${colors.cream}">${esc(business.tagline)}</text>` : ""}
</svg>`);
await sharp(base).composite([{ input: overlay, top: 0, left: 0 }]).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(root, "public/img/og-1200x630.jpg"));

const letter = esc((name.trim()[0] ?? "S").toUpperCase());
const icon = (px) =>
  Buffer.from(`<svg width="${px}" height="${px}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${px / 2}" cy="${px / 2}" r="${px / 2}" fill="${colors.primary}"/>
  <text x="50%" y="50%" dy="0.35em" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(px * 0.58)}" font-weight="600" fill="${colors.cream}">${letter}</text>
</svg>`);
for (const [file, px] of [["icon-32.png", 32], ["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
  await sharp(icon(px)).png().toFile(path.join(root, "public", file));
}
console.log("wrote public/img/og-1200x630.jpg and the icons");
