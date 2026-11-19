import { IMAGES, applySlot, imageSrc, type ImageKey, type SlotId } from "@/lib/images";

interface Props {
  k: ImageKey;
  /** A named place data/photos.json may fill with another photo (scripts/lib/photo-slots.json). */
  slot?: SlotId;
  /** Omit to use the image's own alt (data/photos.json, or "" for a built-in placeholder); pass "" for decoration. */
  alt?: string;
  sizes: string;
  /** The LCP image of the page: eager and high priority. Everything else is lazy. */
  priority?: boolean;
  className?: string;
  /** object-position for cropped uses. */
  position?: string;
  /** Decorative texture: serve only the 800w file, no srcset. */
  small?: boolean;
}

/** Plain <img> with 800w/1600w srcset and intrinsic width/height so nothing shifts. */
export function Img({ k: defaultKey, slot, alt: defaultAlt, sizes, priority = false, className, position, small = false }: Props) {
  const { key: k, alt } = applySlot(slot, defaultKey, defaultAlt);
  const m = IMAGES[k];
  const text = alt ?? m.alt;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc(k, 800)}
      srcSet={small ? undefined : `${imageSrc(k, 800)} ${m.w800}w, ${imageSrc(k, 1600)} ${m.w}w`}
      sizes={small ? undefined : sizes}
      width={m.w}
      height={m.h}
      alt={text}
      aria-hidden={text === "" ? true : undefined}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      className={className}
      style={position ? { objectPosition: position } : undefined}
    />
  );
}
