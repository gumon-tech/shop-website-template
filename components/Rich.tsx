import type { ReactNode } from "react";
import { WaLink } from "@/components/Button";
import { available, fill, type Ctx } from "@/lib/content";
import { HAS_WHATSAPP, MSG, TAG, telHref } from "@/lib/whatsapp";
import { SITE } from "@/lib/site";

const TOKEN = /(\{\{phone_display\}\}|\{\{email\}\}|\*[^*\n]+\*)/;

/**
 * Inline copy: fills placeholders, renders *emphasis* as italics, turns the phone number into a tel: link (or, after
 * "message ", a WhatsApp link) and the email into a mailto: link. Text that needs a fact the shop has not given yet
 * (a {{placeholder}} without a value) renders nothing at all.
 */
export function Rich({ text, ctx }: { text: string; ctx?: Ctx }) {
  if (!available(text, ctx)) return null;
  const parts = text.split(TOKEN);
  const out: ReactNode[] = [];
  let before = "";
  parts.forEach((p, i) => {
    if (p === "{{phone_display}}") {
      if (/message $/i.test(before) && HAS_WHATSAPP) {
        out.push(
          <WaLink key={i} message={MSG.question} tag={TAG.question} className="link">
            {SITE.phoneDisplay}
          </WaLink>,
        );
      } else {
        out.push(
          <a key={i} href={telHref} className="link whitespace-nowrap">
            {SITE.phoneDisplay}
          </a>,
        );
      }
    } else if (p === "{{email}}") {
      out.push(
        <a key={i} href={`mailto:${SITE.email}`} className="link break-all">
          {SITE.email}
        </a>,
      );
    } else if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
      out.push(<em key={i}>{fill(p.slice(1, -1), ctx)}</em>);
    } else {
      out.push(fill(p, ctx));
    }
    before += p;
  });
  return <>{out}</>;
}

/** A run of paragraphs from the copy files; a paragraph that needs a fact not given yet is left out. */
export function Paras({ items, ctx, className = "" }: { items: string[]; ctx?: Ctx; className?: string }) {
  return (
    <>
      {items
        .filter((p) => available(p, ctx))
        .map((p, i) => (
          <p key={i} className={className}>
            <Rich text={p} ctx={ctx} />
          </p>
        ))}
    </>
  );
}
