# Building a shop's website from this template

For the Gumon team member who builds a shop's first site. The Shop Agent bot never creates repositories and never writes a shop's first content: you build the site, then the shop's managers change the parts listed under "What the bot can change" by chatting with the bot.

Each shop gets its own public repository `gumon-tech/shop-site-<shopId>`, published by GitHub Pages at `https://gumon-tech.github.io/shop-site-<shopId>/`, or at the shop's own domain. No secrets go into the repository, ever; nothing here needs one.

## 1. The brief: what to ask the shop for

Collect these before you start. Anything the shop cannot give yet can be left out: the site hides what it does not know (no address means no address line, no map link and no "Where are you?" answer; no WhatsApp number means no booking buttons).

| Ask for | Goes into |
|---|---|
| The shop's name exactly as customers see it, and a short form they never want used (if any) | `name`, `text_rules.short_name` |
| One-line description for the footer and the share image | `tagline` |
| Street address, town, postcode, and the Google Maps link to the listing | `address`, `maps_url` |
| Phone number for calls; WhatsApp number for bookings (often the same) | `phone`, `whatsapp` (`"same-as-phone"`) |
| Email address customers may use | `email` |
| Weekly opening hours | `hours` |
| The menu: each treatment, its group, every length and price | `services` |
| Deposit, if they take one (and the wording of their booking, paying and cancelling terms) | `deposit_gbp`, then `content/_booking-terms.md` |
| Brand colours (one main, one accent) and a logo file if they have one | `brand`, then `data/brand.json` `logo` |
| Their own photos (shop front, rooms, treatments), with permission to publish; no customers' or staff faces without consent | `public/img/` |
| A domain, if they want one (they or we control its DNS) | `domain` |
| A few words about the shop for Home and About; directions (stations, parking) | `content/home.md`, `content/about.md`, `content/visit.md` |
| Who processes customers' data and how long they keep it (for the privacy notice) | `content/privacy.md`, `privacy_updated` |

## 2. Create the repository

```bash
gh repo create gumon-tech/shop-site-<shopId> --public --template gumon-tech/shop-website-template --clone
cd shop-site-<shopId>
npm ci
```

`<shopId>` is lower case with hyphens, and should be the shop's id in the bot (`shops/<shopId>/` in shop-agent). Do not turn on Pages yet: until step 3 the site says "Example Shop".

## 3. Fill it in

1. Copy `examples/new-shop.example.json` to a file outside the repository (it holds the shop's details; it is not committed), replace every value, delete `_example` and `_about`, and run:

   ```bash
   node scripts/new-shop.mjs ../brief-<shopId>.json
   ```

   It writes `data/shop.json` (identity: shopId, name, country, timezone, locale; this script is its only writer), `data/business.json`, `data/brand.json`, `data/hours.json`, `data/services.json`, first entries of `data/faq-extra.json` and `data/promotions.json` if you gave any, `data/text-rules.json`, and `public/CNAME` when there is a domain. It derives the darker and lighter shades from the two brand colours, rebuilds the slot lists, makes the share image and icons, and refuses placeholder values ("Example Shop", example.com, `+44 7700 900xxx`, REPLACE_ME). It works offline. Run it again whenever the brief changes; it overwrites what it writes.

2. Words. Read every `content/*.md` with the shop's details in mind and change the words under the `##` headings (keep the headings: the pages read them). In particular:
   - `content/_booking-terms.md`: the shop's own booking, paying, moving and cancelling terms. With a deposit, add a `### Deposit` section and a `- Deposit:` line that use `{{deposit}}`.
   - `content/visit.md` "getting-here": three cards with the real directions.
   - `content/privacy.md`: go through it with the shop; then set `privacy_updated` in the brief and re-run step 1.
   - Prices, lengths, opening hours and the deposit amount are never typed into the words; they come from the data files through `{{placeholders}}`.
3. Treatment pages (optional, per treatment). Every treatment in the menu gets a page from generic words. For a treatment that deserves its own page, copy `examples/treatment.md` to `content/treatments/<slug>.md` (the slug is in `data/services.json`), write it, then run `node scripts/sync-slots.mjs`.
4. Photos (optional). The template ships neutral placeholder pictures. Replace `public/img/<key>-800.webp` and `-1600.webp` (keys `hero`, `story`, `detail`, `room`, `gift`, `texture`; same shape as the placeholder, WebP, no EXIF/GPS: `sharp(src).rotate().resize(...).webp({quality: 80})` strips it). If the shape changes, update its size in `lib/images.ts`. Then `node scripts/make-og.mjs` for the share image.
5. Logo (optional). Put the files under `public/logo/` and set `data/brand.json` `logo` (`header`, `header_w`, `header_h`, optional `footer`...). `wordmark` gives the header two lines (`{"line1": "Lotus", "line2": "Thai Spa"}`).
6. Check everything, as GitHub will build it:

   ```bash
   GITHUB_REPOSITORY=gumon-tech/shop-site-<shopId> npm run check
   ```

   (PowerShell: `$env:GITHUB_REPOSITORY="gumon-tech/shop-site-<shopId>"; npm run check`.) It must pass: validators and their tests, `check-template.mjs` (no placeholder, no words of the first shop, no secret), the build, and `check-site.mjs` on the built pages. Look at the pages too (`npx next dev`, or serve `out/`).

## 4. Publish

1. Commit and push to `main` (`git add <paths>` for what you changed).
2. Settings > Pages > Build and deployment > Source: **GitHub Actions**. The `Deploy to GitHub Pages` workflow builds and publishes on every push to main, when the bot's pull requests merge, and every night (so ended offers and notices leave the HTML).
3. With a domain: point its DNS at GitHub Pages first (apex `A` records 185.199.108.153, .109, .110, .111; `www` `CNAME` `gumon-tech.github.io`), then Settings > Pages > Custom domain, and tick Enforce HTTPS once offered. Without a domain the site is at `https://gumon-tech.github.io/shop-site-<shopId>/`; links and images work under that path.
4. When the shop is happy, set `"indexable": true` in the brief, re-run step 3.1, push. (Until then every page says noindex.)
5. Do not add a ruleset that requires a review on `main`: the bot's pull requests are merged by the workflow itself, and a required review makes them wait for a person. Requiring the `site-check` status is fine.

## 5. Connect the bot

In shop-agent, `shops/<shopId>/shop.json`, the `web` block (same shape as the first shop's):

```json
"web": {
  "site_repo": "gumon-tech/shop-site-<shopId>",
  "site_url": "https://gumon-tech.github.io/shop-site-<shopId>",
  "base_branch": "main",
  "promos_path": "data/promotions.json",
  "promos_json_url": "https://raw.githubusercontent.com/gumon-tech/shop-site-<shopId>/main/data/promotions.json",
  "promotions_page_url": "https://gumon-tech.github.io/shop-site-<shopId>/#promotions",
  "careers_url": "https://gumon-tech.github.io/shop-site-<shopId>/careers/",
  "add_promos": true,
  "pr_style": "public",
  "auto_merge": true,
  "check_command": "npm run check",
  "team_sync": false,
  "edit": { "enabled": true }
}
```

With a domain, use `https://<domain>` for every URL above. The bot confirms "live" by reading `<site_url>/build.json`. Its GitHub access must include the new repository (no GitHub App and no secret in the website repository).

## What the bot can change (through chat, by pull requests the site checks and merges itself)

| Concern | File | What changes |
|---|---|---|
| promotions | `data/promotions.json` | add offers; end, withdraw or extend existing ones |
| hours | `data/hours.json` | weekly opening hours (management only) |
| closures | `data/closures.json` | closed days and changed-hours days |
| notice | `data/notice.json` | one line under the header on every page |
| faq-extra | `data/faq-extra.json` | extra questions in "More questions" on /faq/ |
| services | `data/services.json` | prices, lengths and names of existing treatments; move a treatment to an existing group |
| copy | `data/copy.json` | the named pieces of wording in `scripts/lib/copy-slots.json` (hero lines, a few paragraphs, treatment intros) |
| seo | `data/seo.json` | page titles and descriptions in `scripts/lib/seo-pages.json` |
| photos | `data/photos.json` + new `public/img/sp-<slug>-800/1600.webp` | put a photo into a named place (`scripts/lib/photo-slots.json`) or retire it |

Branch `shop-agent/<concern>-<id>`, one file per concern; `.github/workflows/auto-merge-shop-agent.yml` checks the branch, the files, `npm run check` and the diff rules (`scripts/lib/shop-agent-diff.mjs`), then merges and publishes. The rules are in README.md, "Data the shop system writes", and are the same for every shop built from this template.

## What is design (a person's change, not through chat)

- Everything in `content/*.md` outside the copy slots: structure, headings, buttons, the core FAQ, booking terms, privacy notice.
- New treatments or removing a treatment (a new slug needs its page and slots), new groups, new pages, the slot lists (`scripts/sync-slots.mjs`).
- `data/shop.json`, `data/business.json` (address, phone, WhatsApp, email, deposit, indexable), `data/brand.json` (colours, logo), `data/text-rules.json`: re-run `scripts/new-shop.mjs` or edit by hand in a pull request.
- Built-in photos in `public/img/` (the bot only adds `sp-` photos next to them), the share image and icons.
- Layout, components, fonts, styles, scripts and workflows: changes to the template itself, made in `gumon-tech/shop-website-template` and copied to shop repositories by a person.
