# Shared copy: header, footer, sticky bar, closing band, hours

## header

- Nav: Treatments -> /treatments/ · About -> /about/ · Gift Vouchers -> /gift-vouchers/ · Visit -> /visit/ · FAQ -> /faq/
- Button (primary, tag N): Book on WhatsApp
- Mobile menu button label: Menu (aria-label "Open menu" / "Close menu")
- Mobile menu footer line: {{hours_sentence}}

The wordmark and logo are design: `data/brand.json` (`wordmark`, `logo`). Without them the header shows the shop's name.

## sticky-bar (phones only)

- Button (primary, tag SB): Book on WhatsApp
- Icon button (secondary, aria-label "See the treatment menu") -> /treatments/

## closing-band

Used on every page except Privacy and 404. Left out until the shop has a WhatsApp number.

Eyebrow: Book your visit

### Book your treatment in a message

Tell us which treatment you would like and when suits you, and we reply in the same chat and confirm your time.

- Button (primary, tag T): Book on WhatsApp
- Line under the button: Questions? Call {{phone_display}}.

## footer

Column 1 (brand): the shop's name (data/shop.json) and its tagline (data/business.json).

Column 2 (visit):
- Heading: Visit
- {{address}}
- Link: Directions on Google Maps -> {{maps_url}}
- {{hours_table}} (compact lines from data/hours.json: closed days first, then one line per run of days with the same hours)

Column 3 (contact):
- Heading: Contact
- Call or WhatsApp: {{phone_display}} (link, tag F)
- Line: Phone calls or WhatsApp messages.
- Email: {{email}}

Column 4 (pages): Treatments · About · Gift Vouchers · Visit · FAQ · Careers · Privacy

Legal line: © {{year}} {{shop_name}}. Website by Gumon Technology.

## hours (data/hours.json)

The opening hours live only in `data/hours.json` (changed by the shop system through an hours pull request) and are rendered by `lib/hours-text.ts`; they are never typed in prose, so nothing here goes stale when they change.

Sentence form: {{hours_sentence}}
Table form: {{hours_table}}, seven rows, Monday first; a closed day reads "Closed".
