import Link from "next/link";
import { Phone } from "lucide-react";
import { Ornament } from "@/components/Ornament";
import { WaLink } from "@/components/Button";
import { closuresForBuild } from "@/lib/closures-data";
import { closureLabel } from "@/lib/hours-text";
import { fill } from "@/lib/content";
import { BRAND } from "@/lib/brand";
import { SITE, asset, hoursCompact } from "@/lib/site";
import { HAS_WHATSAPP, MSG, TAG, telHref } from "@/lib/whatsapp";
import { sharedCopy } from "@/lib/shared";

const PAGE_HREF: Record<string, string> = {
  Treatments: "/treatments/",
  About: "/about/",
  "Gift Vouchers": "/gift-vouchers/",
  Visit: "/visit/",
  FAQ: "/faq/",
  Careers: "/careers/",
  Privacy: "/privacy/",
};

/** The legal line with SITE.builtBy linked to the builder's site; plain text if the copy no longer names it. */
function LegalLine({ text }: { text: string }) {
  const at = text.indexOf(SITE.builtBy);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <a href={SITE.builtByUrl} target="_blank" rel="noopener" className="link">
        {SITE.builtBy}
      </a>
      {text.slice(at + SITE.builtBy.length)}
    </>
  );
}

/** Every column shows only the facts the shop has given (data/business.json, data/hours.json); an empty column is left out. */
export function Footer() {
  const c = sharedCopy();
  const f = c.footer;
  const hours = hoursCompact();
  const closures = closuresForBuild();
  const hasVisit = Boolean(SITE.address || SITE.mapsUrl || hours.length || closures.length);
  const hasContact = Boolean(SITE.phoneDisplay || SITE.email);
  return (
    <footer className="on-primary bg-primary-deep text-cream">
      <div className="container-x py-14 xl:py-20">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <div>
            {BRAND.logo?.footer && (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(BRAND.logo.footer)} width={BRAND.logo.footer_w} height={BRAND.logo.footer_h} alt="" aria-hidden="true" loading="lazy" className="h-10 w-auto" />
              </div>
            )}
            <p className="mt-4 font-display text-2xl font-semibold">{f.name}</p>
            {f.blurb && <p className="mt-2 max-w-xs text-accent-pale">{f.blurb}</p>}
          </div>

          {hasVisit && (
            <div>
              <h2 className="eyebrow">{f.visitHeading}</h2>
              {SITE.address && <address className="mt-3 not-italic">{SITE.address}</address>}
              {SITE.mapsUrl && (
                <a href={SITE.mapsUrl} target="_blank" rel="noopener" className="link mt-1 inline-flex min-h-[44px] items-center">
                  {f.directions}
                </a>
              )}
              <p className="mt-2 text-accent-pale">
                {hours.map((h) => (
                  <span key={h} className="block">
                    {h}
                  </span>
                ))}
                {closures.map((cl) => (
                  <span key={cl.code} data-closure-foot={cl.code} className="mt-1 block font-medium text-cream">
                    {closureLabel(cl)}
                  </span>
                ))}
              </p>
            </div>
          )}

          {hasContact && (
            <div>
              <h2 className="eyebrow">{f.contactHeading}</h2>
              {SITE.phoneDisplay && (
                <div className="mt-3 flex items-center gap-2">
                  {HAS_WHATSAPP ? (
                    <WaLink message={MSG.book} tag={TAG.footer} className="link inline-flex min-h-[44px] items-center text-lg">
                      <span className="sr-only">WhatsApp </span>
                      {SITE.phoneDisplay}
                    </WaLink>
                  ) : (
                    <span className="text-lg">{SITE.phoneDisplay}</span>
                  )}
                  {telHref && (
                    <a
                      href={telHref}
                      aria-label={`Call ${SITE.phoneDisplay}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-accent-pale/60 text-accent-pale hover:bg-accent-pale hover:text-primary-deep"
                    >
                      <Phone size={18} aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}
              {SITE.phoneDisplay && f.phoneLine && <p className="mt-1 max-w-xs text-sm text-accent-pale">{f.phoneLine}</p>}
              {SITE.email && (
                <a href={`mailto:${SITE.email}`} className="link mt-3 inline-flex min-h-[44px] items-center break-all">
                  {SITE.email}
                </a>
              )}
            </div>
          )}

          <nav aria-label="Footer">
            <h2 className="sr-only">Pages</h2>
            <ul className="md:mt-0">
              {f.pages.map((p) => (
                <li key={p}>
                  <Link href={PAGE_HREF[p] ?? "/"} className="inline-flex min-h-[44px] items-center text-cream hover:text-accent-pale">
                    {p}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-accent-pale/20 pt-8">
          <Ornament tone="pale" />
          <p className="text-center text-sm text-accent-pale">
            <LegalLine text={fill(f.legal)} />
          </p>
        </div>
      </div>
    </footer>
  );
}
