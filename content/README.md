# Content files

Customer-facing copy, one file per page, UK English. Written by the team when a shop's site is built; afterwards the shop system changes only the named pieces listed in `scripts/lib/copy-slots.json` (through `data/copy.json`) and page titles (through `data/seo.json`), never these files.

Conventions

- `## section-id` headings are read by the page code (`app/`). Keep the ids; change the words under them.
- `- Button (primary, tag X): Label` is a WhatsApp button (tag register: `lib/whatsapp.ts`). `- Button (secondary): Label -> /path/` is a page link.
- `[image: key]` is documentation only; the page code picks the image (built-in key or photo slot).
- `{{placeholders}}` are filled by the code from `data/*.json` and the two shared files below. A duration, a price, the deposit amount or the opening hours never appear typed out in prose. A paragraph, FAQ answer or link whose placeholder has no value yet (say `{{address}}` before the shop has given one) is left out of the page.
- `{{shop_name}}` may also be used in front matter (titles and descriptions).
- Shared blocks: `_booking-terms.md` (money terms, one place), `_shared.md` (header, footer, sticky bar, closing band, hours phrasing).
- Treatment pages: `treatments/<slug>.md`, keyed by the `slug` in `data/services.json`. A slug without a file uses the generic copy at the end of `treatments.md`. After adding or removing one, run `node scripts/sync-slots.mjs`.
- Front matter per page: `title`, `description`, `h1`. Titles at most 60 characters, descriptions at most 155.

Hard rules: no medical or health-result claims, no review quotes or star counts, no cookie or analytics wording, no emoji.
