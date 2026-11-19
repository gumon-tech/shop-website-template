import Link from "next/link";
import { List } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { HAS_WHATSAPP, buildWhatsAppLink, MSG, TAG } from "@/lib/whatsapp";
import { sharedCopy } from "@/lib/shared";

/** Phones only. Fixed, so it never shifts layout; the spacer after the footer keeps content clear of it. */
export function StickyBar() {
  const c = sharedCopy();
  // The bar is a booking bar: without a WhatsApp number there is nothing to book with yet.
  if (!HAS_WHATSAPP) return null;
  return (
    <>
      <div className="h-[calc(76px+env(safe-area-inset-bottom))] bg-primary-deep md:hidden" aria-hidden="true" />
      <div className="sticky-bar fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 bg-cream px-4 pt-3 shadow-bar md:hidden" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <a
          href={buildWhatsAppLink(MSG.book, TAG.sticky)}
          target="_blank"
          rel="noopener"
          className="btn btn-primary min-h-[48px] flex-1"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream">
            <WhatsAppIcon size={18} className="text-whatsapp" />
          </span>
          <span>{c.stickyLabel}</span>
        </a>
        <Link
          href="/treatments/"
          aria-label={c.stickyAria}
          className="btn btn-secondary h-12 min-h-[48px] w-12 shrink-0 !p-0"
        >
          <List size={22} aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}
