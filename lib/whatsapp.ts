import { SITE } from "@/lib/site";

/**
 * Source tags appended to every pre-filled WhatsApp message as " [web-X]", so
 * the room answering WhatsApp can see where an enquiry came from. One or two
 * capital letters. The same register for every shop built from this template (the bot and the WhatsApp room read it).
 * QS is reserved for a printed QR in the shop and is not used on the site.
 */
export const TAG = {
  home: "O",
  header: "N",
  card: "H",
  menu: "M",
  question: "Q",
  gift: "G",
  visit: "C",
  about: "A",
  sticky: "SB",
  closing: "T",
  footer: "F",
  notFound: "E",
  careers: "CR",
  /** The Book button on /tour/. */
  tour: "TR",
  /** The Book button on an offer card (data/promotions.json). */
  offer: "PR",
} as const;

/** Per-treatment tag for the option buttons on a treatment page (data/business.json "treatment_tags", slug -> one or two capitals). */
export const TREATMENT_TAG: Record<string, string> = Object.fromEntries(
  Object.entries(SITE.treatmentTags).filter(([, t]) => /^[A-Z]{1,2}$/.test(t)),
);

/** Used if a treatment has no registered tag; a missing one must not break the build. */
export const TAG_UNKNOWN_TREATMENT = "M";

/** "an Aromatherapy Massage", "a Thai Massage". */
export function withArticle(name: string): string {
  return `${/^[aeiou]/i.test(name) ? "an" : "a"} ${name}`;
}

/** False until data/business.json has a WhatsApp number: every WhatsApp button and link is then left out of the page. */
export const HAS_WHATSAPP: boolean = Boolean(SITE.whatsappNumber);

/** https://wa.me/<digits>?text=<encoded message + " [web-X]">, or "" while the shop has no WhatsApp number. */
export function buildWhatsAppLink(message: string, tag: string): string {
  if (!SITE.whatsappNumber) return "";
  const text = `${message.trim()} [web-${tag}]`;
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

const hi = `Hi ${SITE.name},`;

export const MSG = {
  book: `${hi} I'd like to book please.`,
  gift: `${hi} I'd like to buy a gift voucher please.`,
  question: `${hi} I have a question please.`,
  careers: `${hi} I'd like to ask about working with you please.`,
  questionAbout: (name: string) => `${hi} I have a question about ${name} please.`,
  service: (name: string) => `${hi} I'd like to book ${withArticle(name)} please.`,
  serviceOption: (name: string, option: string) => `${hi} I'd like to book ${withArticle(name)} (${option}) please.`,
};

export const telHref = SITE.phoneE164 ? `tel:${SITE.phoneE164}` : "";

/** The message that goes with a tag when a button comes from the copy files. */
export function messageForTag(tag: string, name?: string): string {
  if (tag === TAG.gift) return MSG.gift;
  if (tag === TAG.careers) return MSG.careers;
  if (tag === TAG.question) return name ? MSG.questionAbout(name) : MSG.question;
  return MSG.book;
}
