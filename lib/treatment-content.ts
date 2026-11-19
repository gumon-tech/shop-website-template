import { existsSync } from "node:fs";
import path from "node:path";
import { fill, fmString, loadDoc, section, type Block, type Doc } from "@/lib/content";
import { IMAGES, TREATMENT_DEFAULT_IMAGE, applySlot, isImageKey, type ImageKey } from "@/lib/images";
import { getTreatment } from "@/lib/services";

export function hasTreatmentFile(slug: string): boolean {
  return existsSync(path.join(process.cwd(), "content", "treatments", `${slug}.md`));
}

export function treatmentDoc(slug: string): Doc | null {
  return hasTreatmentFile(slug) ? loadDoc(`treatments/${slug}.md`) : null;
}

/** A built-in image named in a treatment file's front matter, or the default. */
function fmImage(doc: Doc | null, key: string): ImageKey {
  const v = doc?.fm[key];
  return typeof v === "string" && isImageKey(v) && v in IMAGES ? v : TREATMENT_DEFAULT_IMAGE;
}

/** Card/menu image for a slug: the photo in slot treatment.<slug>.card, else the file's card_image, else the default. */
export function imageFor(slug: string): { key: ImageKey; alt: string } {
  const key = fmImage(treatmentDoc(slug), "card_image");
  const o = applySlot(`treatment.${slug}.card`, key, IMAGES[key].alt);
  return { key: o.key, alt: o.alt ?? "" };
}

/** Hero image of a treatment page without its own content file: slot treatment.<slug>.hero, else its card image. */
export function genericHeroImage(slug: string): { key: ImageKey; alt: string } {
  const card = imageFor(slug);
  const o = applySlot(`treatment.${slug}.hero`, card.key, card.alt);
  return { key: o.key, alt: o.alt ?? "" };
}

/** The one-line description used on cards and menu rows. */
export function cardLine(slug: string): string {
  const doc = treatmentDoc(slug);
  if (doc) return fmString(doc, "card");
  const generic = section(loadDoc("treatments.md"), "generic-treatment-copy");
  const line = generic.lines.find((l) => l.startsWith("Card line:"));
  return (line ?? "").replace("Card line:", "").trim();
}

export function genericIntro(slug: string): string {
  const t = getTreatment(slug);
  const generic = section(loadDoc("treatments.md"), "generic-treatment-copy");
  const para = generic.paras.find((p) => p.startsWith("Intro:")) ?? "";
  return fill(para.replace("Intro:", "").trim(), { name: t?.name ?? "" });
}

export interface TreatmentCopy {
  doc: Doc;
  title: string;
  description: string;
  h1: string;
  card: string;
  heroImage: ImageKey;
  heroAlt: string;
  secondaryImage: ImageKey;
  secondaryAlt: string;
  alsoLike: string[];
  hero: Block;
  expect: Block;
  focus: Block;
  room: Block;
  faq: Block;
}

export function treatmentCopy(slug: string): TreatmentCopy | null {
  const doc = treatmentDoc(slug);
  if (!doc) return null;
  const heroImage = fmImage(doc, "hero_image");
  const secondaryImage = fmImage(doc, "secondary_image");
  const heroAlt = IMAGES[heroImage].alt;
  const secondaryAlt = IMAGES[secondaryImage].alt;
  const also = doc.fm["also_like"];
  const hero = applySlot(`treatment.${slug}.hero`, heroImage, heroAlt);
  const second = applySlot(`treatment.${slug}.secondary`, secondaryImage, secondaryAlt);
  return {
    doc,
    title: fmString(doc, "title"),
    description: fmString(doc, "description"),
    h1: fmString(doc, "h1"),
    card: fmString(doc, "card"),
    heroImage: hero.key,
    heroAlt: hero.alt ?? heroAlt,
    secondaryImage: second.key,
    secondaryAlt: second.alt ?? secondaryAlt,
    alsoLike: Array.isArray(also) ? also : [],
    hero: section(doc, "hero"),
    expect: section(doc, "what-to-expect"),
    focus: section(doc, "focus"),
    room: section(doc, "room-image"),
    faq: section(doc, "faq"),
  };
}
