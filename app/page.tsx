import type { Metadata } from "next";
import { Award, Clock, MapPin } from "lucide-react";
import { ActionView } from "@/components/Actions";
import { ClosingBand } from "@/components/ClosingBand";
import { Hero } from "@/components/Hero";
import { Img } from "@/components/Img";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { PromoCards } from "@/components/PromoCards";
import { Paras, Rich } from "@/components/Rich";
import { SectionHead } from "@/components/SectionHead";
import { TreatmentCard } from "@/components/TreatmentCard";
import { available, fmString, loadDoc, section, trailingActions } from "@/lib/content";
import { promotionsForBuild } from "@/lib/promotions-data";
import { pageMetadata } from "@/lib/seo";
import { HAS_MENU, TREATMENTS } from "@/lib/services";
import { cardLine } from "@/lib/treatment-content";
import { businessLd } from "@/lib/structured-data";

const doc = loadDoc("home.md");

export const metadata: Metadata = pageMetadata({
  title: fmString(doc, "title"),
  description: fmString(doc, "description"),
  path: "/",
});

const FACT_ICONS = [MapPin, Clock, Award];

export default function HomePage() {
  const hero = section(doc, "hero");
  const offers = section(doc, "offers");
  const how = section(doc, "how-booking-works");
  const prev = section(doc, "treatments-preview");
  const roots = section(doc, "our-story");
  const gift = section(doc, "gift-vouchers-strip");
  const visit = section(doc, "visit");

  const { promos, buildDay } = promotionsForBuild();
  const offerCopy = {
    eyebrow: offers.eyebrow ?? "",
    title: offers.h2 ?? "",
    validUntil: offers.small ?? "",
    button: offers.actions[0]?.label ?? "",
  };

  const details = prev.actions.find((a) => a.label === "Details")?.label ?? "Details";
  const bookLabel = prev.actions.find((a) => a.tag === "H")?.label ?? "Book";
  const seeAll = prev.actions.find((a) => a.href === "/treatments/");

  return (
    <>
      <JsonLd data={businessLd()} />

      <Hero
        imageKey="hero"
        slot="home.hero"
        eyebrow={hero.eyebrow}
        h1={<Rich text={hero.h1 ?? ""} />}
        lead={<Rich text={hero.lead ?? ""} />}
        glow
        topSpace="pt-[300px]"
        position="50% 30%"
        actions={
          <>
            <ActionView action={hero.actions[0]} variant="heroPrimary" />
            <ActionView action={hero.actions[1]} variant="heroGhost" />
          </>
        }
        facts={
          <ul className="flex flex-wrap gap-2 bg-sand px-4 py-4 md:px-8 lg:mt-8 lg:bg-transparent lg:p-0">
            {hero.bullets.filter((f) => available(f)).map((f, i) => {
              const Icon = FACT_ICONS[i] ?? MapPin;
              return (
                <li
                  key={f}
                  className="hero-rise flex items-center gap-2 rounded-full border border-stone bg-cream px-4 py-2 text-sm font-medium text-ink"
                  style={{ "--i": i + 2 } as React.CSSProperties}
                >
                  <Icon size={16} className="shrink-0 text-accent-deep" aria-hidden="true" />
                  <Rich text={f} />
                </li>
              );
            })}
          </ul>
        }
      />

      {/* Current offers: only when data/promotions.json has a live one today. Anchor #promotions. */}
      <PromoCards promos={promos} buildDay={buildDay} copy={offerCopy} />

      {/* How booking works */}
      <section className="on-primary relative overflow-hidden bg-primary text-cream section-y" aria-labelledby="how-h">
        <Img
          k="texture"
          alt=""
          sizes="100vw"
          small
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12]"
        />
        <div className="container-x relative">
          <SectionHead eyebrow={how.eyebrow} title={how.h2} id="how-h" tone="primary">
            <Paras items={how.paras} />
          </SectionHead>
          <ol className="mt-10 grid gap-4 xl:grid-cols-3 xl:gap-6">
            {how.subs.map((s, i) => {
              const m = /^(\d+)\.\s*(.*)$/.exec(s.h3);
              return (
                <Reveal as="li" key={s.h3} i={i} className="rounded-r-md border border-accent-pale/25 bg-primary-deep/60 p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-pale font-body text-lg font-semibold text-accent-pale" aria-hidden="true">
                    {m?.[1] ?? i + 1}
                  </span>
                  <h3 className="t-h3 mt-4">{m?.[2] ?? s.h3}</h3>
                  <p className="mt-2">
                    <Rich text={s.paras[0]} />
                  </p>
                </Reveal>
              );
            })}
          </ol>
          <Reveal className="mt-10">
            <ActionView action={trailingActions(how)[0]} variant="ghost" />
          </Reveal>
        </div>
      </section>

      {/* Treatments preview: only once the menu has rows */}
      {HAS_MENU && (
      <section className="section-y" aria-labelledby="prev-h">
        <div className="container-x">
          <SectionHead eyebrow={prev.eyebrow} title={prev.h2} id="prev-h">
            <p>{prev.paras[0]}</p>
          </SectionHead>
        </div>
        <div className="container-x mt-8 xl:mt-12">
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 md:-mx-8 md:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
            {TREATMENTS.map((t, i) => (
              <Reveal key={t.slug} i={i} className="w-[78vw] max-w-[360px] shrink-0 snap-start lg:w-auto lg:max-w-none">
                <TreatmentCard t={t} card={cardLine(t.slug)} details={details} book={bookLabel} />
              </Reveal>
            ))}
          </div>
          {seeAll && (
            <p className="mt-4 xl:mt-8">
              <ActionView action={seeAll} />
            </p>
          )}
        </div>
      </section>
      )}

      {/* Our story */}
      <section className="bg-sand section-y" aria-labelledby="roots-h">
        <div className="container-x grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <figure className="lg:col-span-5">
            <div className="overflow-hidden rounded-r-frame shadow-card">
              <Img k="story" slot="home.our-story" sizes="(min-width:1280px) 480px, (min-width:1024px) 40vw, 100vw" className="aspect-square w-full object-cover" />
            </div>
            <figcaption className="mt-3 text-sm text-ink-2">{roots.caption}</figcaption>
          </figure>
          <div className="lg:col-span-7">
            <SectionHead eyebrow={roots.eyebrow} title={roots.h2} id="roots-h" />
            <Reveal i={2} className="mt-6 space-y-4">
              <Paras items={roots.paras} />
            </Reveal>
            <div className="mt-4">
              {roots.actions[0] && <ActionView action={roots.actions[0]} />}
            </div>
          </div>
        </div>
      </section>

      {/* Gift vouchers strip */}
      <section className="section-y" aria-labelledby="gift-h">
        <div className="container-x">
          <div className="grid items-center gap-8 rounded-r-frame bg-primary-tint p-6 md:p-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <SectionHead eyebrow={gift.eyebrow} title={gift.h2} id="gift-h" />
              <Reveal i={2} className="mt-5">
                <Paras items={gift.paras} />
              </Reveal>
              <Reveal i={3} className="mt-6">
                <ActionView action={gift.actions[0]} />
              </Reveal>
            </div>
            <div className="overflow-hidden rounded-r-frame shadow-card">
              <Img k="gift" slot="home.gift" sizes="(min-width:1280px) 520px, (min-width:1024px) 45vw, 100vw" className="aspect-[16/9] w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Visit: once the shop has given an address or hours */}
      {visit.bullets.some((b) => available(b)) && (
      <section className="pb-14 xl:pb-24" aria-labelledby="visit-h">
        <div className="container-x">
          <div className="relative lg:mb-16">
            <div className="overflow-hidden rounded-r-frame shadow-card">
              <Img k="room" slot="home.visit" sizes="(min-width:1280px) 1104px, 100vw" className="aspect-[1600/700] w-full object-cover" />
            </div>
            <div className="card mt-4 p-6 lg:absolute lg:-bottom-12 lg:left-8 lg:mt-0 lg:max-w-md xl:p-8">
              <p className="eyebrow">{visit.eyebrow}</p>
              <h2 id="visit-h" className="t-h2 mt-2">
                {visit.h2}
              </h2>
              {available(visit.bullets[0]) && (
                <address className="mt-4 not-italic">
                  <Rich text={visit.bullets[0]} />
                </address>
              )}
              {visit.bullets.slice(1).filter((b) => available(b)).map((b) => (
                <p key={b} className="mt-1 text-ink-2">
                  <Rich text={b} />
                </p>
              ))}
              <ul className="mt-2">
                {visit.actions.map((a) => (
                  <li key={a.label}>
                    <ActionView action={a} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      )}

      <ClosingBand />
    </>
  );
}
