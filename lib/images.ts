// Image keys, intrinsic sizes (of the -1600 file; the -800 file has the same
// ratio) and alt text.

import photos from "@/data/photos.json";
import slotList from "@/scripts/lib/photo-slots.json";
import { asset } from "@/lib/site";

type BuiltInKey = "hero" | "story" | "detail" | "room" | "gift" | "texture";

/** A built-in photo, or one the shop system added (key sp-<slug>, data/photos.json). */
export type ImageKey = BuiltInKey | `sp-${string}`;

interface ImageMeta {
  w: number;
  h: number;
  /** 800w file width (height scales). */
  w800: number;
  h800: number;
  alt: string;
}

// The template's neutral placeholders (scripts/make-placeholder-images.mjs): no shop, no people, so the alt is empty
// (decorative) until a photo slot or a person puts a real photo in its place.
const BUILT_IN: Record<BuiltInKey, ImageMeta> = {
  hero: { w: 1200, h: 1600, w800: 600, h800: 800, alt: "" },
  story: { w: 1200, h: 1600, w800: 600, h800: 800, alt: "" },
  detail: { w: 1024, h: 1024, w800: 800, h800: 800, alt: "" },
  room: { w: 1600, h: 700, w800: 800, h800: 350, alt: "" },
  gift: { w: 1600, h: 900, w800: 800, h800: 450, alt: "" },
  texture: { w: 1024, h: 1536, w800: 533, h800: 800, alt: "" },
};

export function isImageKey(k: string): k is ImageKey {
  return k in BUILT_IN || /^sp-[a-z0-9-]{3,40}$/.test(k);
}

interface PhotoEntry extends ImageMeta {
  key: string;
  added: string;
  status: "live" | "retired";
}
const PHOTOS = photos as unknown as { images: PhotoEntry[]; slots: Record<string, string | null> };

/** Built-in photos plus the live ones from data/photos.json. A retired photo is not in the map. */
export const IMAGES: Record<string, ImageMeta> = {
  ...BUILT_IN,
  ...Object.fromEntries(PHOTOS.images.filter((i) => i.status === "live").map((i) => [i.key, { w: i.w, h: i.h, w800: i.w800, h800: i.h800, alt: i.alt }])),
};

export type SlotId = string;
const SLOT_IDS = new Set(slotList.slots.map((s) => s.id));

/**
 * A named place on the site that data/photos.json may point at a bot-added photo. Unset (null): the built-in photo and alt the
 * caller passes. Set: the photo's own key and alt. An unknown slot id is a build error, so a typo cannot silently do nothing.
 */
export function applySlot(slot: SlotId | undefined, key: ImageKey, alt?: string): { key: ImageKey; alt: string | undefined } {
  if (!slot) return { key, alt };
  if (!SLOT_IDS.has(slot)) throw new Error(`unknown photo slot "${slot}" (scripts/lib/photo-slots.json)`);
  const k = PHOTOS.slots[slot];
  const m = k ? IMAGES[k] : undefined;
  return k && m ? { key: k as ImageKey, alt: m.alt } : { key, alt };
}

/** The default card, menu and hero picture of a treatment (its own photo comes from the slot treatment.<slug>.card). */
export const TREATMENT_DEFAULT_IMAGE: ImageKey = "detail";

export function imageSrc(key: ImageKey, size: 800 | 1600): string {
  return asset(`/img/${key}-${size}.webp`);
}
