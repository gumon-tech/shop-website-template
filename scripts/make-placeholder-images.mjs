// Writes the template's built-in placeholder photos: soft neutral gradients with no text, no people and no shop, so a new
// shop's site looks finished before it has photos of its own. A shop's real photos replace them through the photo slots
// (data/photos.json, the shop system) or by a person overwriting public/img/<key>-800.webp and -1600.webp.
//   node scripts/make-placeholder-images.mjs
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "public", "img");
mkdirSync(dir, { recursive: true });

// key: [width, height of the 1600 file, two gradient colours, highlight position]
export const PLACEHOLDERS = {
  hero: [1200, 1600, "#d9d3c7", "#9aa3ad", [0.7, 0.25]],
  story: [1200, 1600, "#e3ddd2", "#b3a58c", [0.3, 0.3]],
  detail: [1024, 1024, "#ece7de", "#a9b2a3", [0.6, 0.4]],
  room: [1600, 700, "#e9e4da", "#b9b0a2", [0.25, 0.35]],
  gift: [1600, 900, "#e6dfd3", "#c2b49a", [0.65, 0.3]],
  texture: [1024, 1536, "#cfd3d6", "#8e979f", [0.5, 0.2]],
};

const svg = (w, h, a, b, [hx, hy]) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
    <radialGradient id="r" cx="${hx}" cy="${hy}" r="0.6"><stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#r)"/>
  <circle cx="${w * 0.18}" cy="${h * 0.82}" r="${Math.min(w, h) * 0.22}" fill="#ffffff" fill-opacity="0.12"/>
  <circle cx="${w * 0.86}" cy="${h * 0.7}" r="${Math.min(w, h) * 0.14}" fill="#ffffff" fill-opacity="0.1"/>
</svg>`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [key, [w, h, a, b, hi]] of Object.entries(PLACEHOLDERS)) {
    const base = sharp(Buffer.from(svg(w, h, a, b, hi)));
    await base.clone().webp({ quality: 70 }).toFile(path.join(dir, `${key}-1600.webp`));
    const w8 = w >= h ? 800 : Math.round((800 * w) / h);
    await base.clone().resize({ width: w >= h ? 800 : undefined, height: w >= h ? undefined : 800 }).webp({ quality: 70 }).toFile(path.join(dir, `${key}-800.webp`));
    const meta = await sharp(path.join(dir, `${key}-800.webp`)).metadata();
    console.log(`${key}: 1600 file ${w}x${h}, 800 file ${meta.width}x${meta.height} (${w8})`);
  }
}
