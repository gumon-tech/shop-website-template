// Rebuilds the three slot lists the shop system works from, and the matching keys in its data files, from the pages and the
// treatments this site has:
//   scripts/lib/copy-slots.json   text slots (data/copy.json)       fixed page slots + treatment.<slug>.h1/.intro per content/treatments/<slug>.md
//   scripts/lib/photo-slots.json  photo slots (data/photos.json)    fixed page slots + treatment.<slug>.card/.hero per slug, .secondary with a content file
//   scripts/lib/seo-pages.json    retitled pages (data/seo.json)    fixed pages + every /treatments/<slug>/ with a content file
// Values already set in data/copy.json, data/seo.json and data/photos.json are kept; a key whose slot no longer exists is
// dropped (the script says so). A person runs it after adding or removing a treatment, and scripts/new-shop.mjs runs it.
// The lists stay a person's change: the shop system never edits them (the auto-merge workflow refuses any file but its own).
//   node scripts/sync-slots.mjs           write
//   node scripts/sync-slots.mjs --check   exit 1 if a slot list would change (npm run validate runs this)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (rel) => path.join(root, rel);
const pretty = (o) => JSON.stringify(o, null, 2) + "\n";

const PAGES = { home: "home.md", about: "about.md", treatments: "treatments.md", "gift-vouchers": "gift-vouchers.md", visit: "visit.md", faq: "faq.md", careers: "careers.md" };
const TITLE = { home: "Home", about: "About", treatments: "Treatments", "gift-vouchers": "Gift vouchers", visit: "Visit", faq: "FAQ", careers: "Careers" };

function copySlots(slugsWithFiles) {
  const slots = {};
  const add = (key, kind, max, file, section, field, where) => (slots[key] = { kind, max, file, ...(section ? { section } : {}), field, where });
  for (const [page, file] of Object.entries(PAGES)) {
    add(`${page}.hero.eyebrow`, "line", 60, file, "hero", "eyebrow", `${TITLE[page]}: small line above the main heading`);
    add(`${page}.hero.h1`, "line", 100, file, "hero", "h1", `${TITLE[page]}: main heading`);
    add(`${page}.hero.lead`, "paragraph", 400, file, "hero", "lead", `${TITLE[page]}: paragraph under the main heading`);
  }
  add("home.how-booking-works.body", "paragraph", 400, "home.md", "how-booking-works", "paras.0", "Home, How booking works: paragraph under the heading");
  add("home.how-booking-works.step-1", "paragraph", 300, "home.md", "how-booking-works", "subs.0.paras.0", "Home, How booking works: step 1 text");
  add("home.how-booking-works.step-2", "paragraph", 300, "home.md", "how-booking-works", "subs.1.paras.0", "Home, How booking works: step 2 text");
  add("home.treatments-preview.body", "paragraph", 400, "home.md", "treatments-preview", "paras.0", "Home, Our treatments: paragraph under the heading");
  add("home.our-story.body-1", "paragraph", 700, "home.md", "our-story", "paras.0", "Home, Our story: first paragraph");
  add("home.our-story.body-2", "paragraph", 700, "home.md", "our-story", "paras.1", "Home, Our story: second paragraph");
  add("home.gift-vouchers.body", "paragraph", 500, "home.md", "gift-vouchers-strip", "paras.0", "Home, Gift vouchers strip: paragraph");
  add("about.our-team.body-1", "paragraph", 700, "about.md", "our-team", "paras.0", "About, Our team: first paragraph");
  add("about.our-team.body-2", "paragraph", 700, "about.md", "our-team", "paras.1", "About, Our team: second paragraph");
  add("about.the-space.body-1", "paragraph", 700, "about.md", "the-space", "paras.0", "About, Our space: first paragraph");
  add("about.the-space.body-2", "paragraph", 700, "about.md", "the-space", "paras.1", "About, Our space: second paragraph");
  add("about.how-we-work.card-1", "paragraph", 300, "about.md", "how-we-work", "subs.0.paras.0", "About, How we work: first card text");
  add("visit.getting-here.card-1", "paragraph", 300, "visit.md", "getting-here", "subs.0.paras.0", "Visit, Getting here: first card");
  add("visit.getting-here.card-2", "paragraph", 300, "visit.md", "getting-here", "subs.1.paras.0", "Visit, Getting here: second card");
  add("visit.getting-here.card-3", "paragraph", 300, "visit.md", "getting-here", "subs.2.paras.0", "Visit, Getting here: third card");
  add("visit.before-you-come.arrive-early", "paragraph", 300, "visit.md", "before-you-come", "subs.0.paras.0", "Visit, Before you come: first card");
  add("gift-vouchers.how-it-works.step-1", "paragraph", 300, "gift-vouchers.md", "how-it-works", "subs.0.paras.0", "Gift vouchers, How it works: step 1 text");
  add("gift-vouchers.how-it-works.step-3", "paragraph", 300, "gift-vouchers.md", "how-it-works", "subs.2.paras.0", "Gift vouchers, How it works: step 3 text");
  for (const n of [1, 2, 3]) add(`careers.how-to-apply.step-${n}`, "paragraph", 300, "careers.md", "how-to-apply", `subs.${n - 1}.paras.0`, `Careers, How to apply: card ${n} text`);
  for (const slug of slugsWithFiles) {
    add(`treatment.${slug}.h1`, "line", 80, `treatments/${slug}.md`, null, "fm.h1", `Treatment page ${slug}: main heading`);
    add(`treatment.${slug}.intro`, "paragraph", 400, `treatments/${slug}.md`, "hero", "lead", `Treatment page ${slug}: paragraph under the heading (also the Service description in search results)`);
  }
  return {
    _note: "The fixed list of text slots the shop system may fill through data/copy.json (README, \"copy\"). Each slot replaces one piece of a content/*.md file when its value is not null. Generated by scripts/sync-slots.mjs; read by lib/content.ts, validate-copy.mjs, check-site.mjs and the shop bot. Changing it is a human PR; never add a slot whose text holds deposit, booking-terms, payment, privacy or health-safety wording.",
    slots,
  };
}

function photoSlots(slugs, slugsWithFiles) {
  const slots = [
    { id: "home.hero", where: "Home page, top photo (portrait)" },
    { id: "home.our-story", where: "Home page, Our story (square)" },
    { id: "home.gift", where: "Home page, gift vouchers strip (16:9)" },
    { id: "home.visit", where: "Home page, Visit section (wide)" },
    { id: "about.hero", where: "About page, top photo (portrait)" },
    { id: "about.our-team", where: "About page, first section (square)" },
    { id: "about.space-1", where: "About page, Our space, wide photo" },
    { id: "about.space-2", where: "About page, Our space, second photo (3:4 on desktop)" },
    { id: "gift-vouchers.hero", where: "Gift vouchers page, top photo" },
    { id: "visit.room", where: "Visit page, The room (wide)" },
  ];
  for (const slug of slugs) {
    slots.push({ id: `treatment.${slug}.card`, where: `${slug}: card on Home, row on the menu, 'You might also like' thumbnail (square crop)` });
    slots.push({ id: `treatment.${slug}.hero`, where: `${slug}: top photo of its page` });
    if (slugsWithFiles.includes(slug)) slots.push({ id: `treatment.${slug}.secondary`, where: `${slug}: second photo of its page (wide crop)` });
  }
  return { _note: "The fixed list of places on the site a bot-added photo may fill. Generated by scripts/sync-slots.mjs; read by validate-photos.mjs, lib/images.ts and the shop bot. Changing it is a human PR.", slots };
}

function seoPages(slugsWithFiles) {
  const pages = { "/": "home.md", "/treatments/": "treatments.md", "/gift-vouchers/": "gift-vouchers.md", "/about/": "about.md", "/visit/": "visit.md", "/faq/": "faq.md", "/careers/": "careers.md" };
  for (const slug of slugsWithFiles) pages[`/treatments/${slug}/`] = `treatments/${slug}.md`;
  return { _note: "Pages whose <title> and meta description the shop system may set through data/seo.json (README, \"seo\"), and the content file that holds their front-matter fallback. Generated by scripts/sync-slots.mjs. Changing it is a human PR.", pages };
}

export function plan(rootDir = root) {
  const rj = (rel) => JSON.parse(readFileSync(path.join(rootDir, rel), "utf8"));
  const services = rj("data/services.json").services;
  const slugs = [...new Set(services.map((s) => s.slug))];
  const withFiles = slugs.filter((s) => existsSync(path.join(rootDir, "content", "treatments", `${s}.md`)));
  const copyList = copySlots(withFiles);
  const photoList = photoSlots(slugs, withFiles);
  const seoList = seoPages(withFiles);
  const notes = [];

  const copy = rj("data/copy.json");
  const newCopy = { updated_at: copy.updated_at, slots: {} };
  for (const k of Object.keys(copyList.slots)) newCopy.slots[k] = copy.slots?.[k] ?? null;
  for (const [k, v] of Object.entries(copy.slots ?? {})) if (!(k in copyList.slots) && v !== null) notes.push(`data/copy.json: dropped "${k}" (its slot no longer exists): ${JSON.stringify(v)}`);

  const seo = rj("data/seo.json");
  const newSeo = { updated_at: seo.updated_at, pages: {} };
  for (const r of Object.keys(seoList.pages)) newSeo.pages[r] = { title: seo.pages?.[r]?.title ?? null, description: seo.pages?.[r]?.description ?? null };
  for (const [r, o] of Object.entries(seo.pages ?? {})) if (!(r in seoList.pages) && (o?.title || o?.description)) notes.push(`data/seo.json: dropped "${r}"`);

  const photos = rj("data/photos.json");
  const ids = photoList.slots.map((s) => s.id);
  const newPhotos = { updated_at: photos.updated_at, images: photos.images ?? [], slots: {} };
  for (const id of ids) newPhotos.slots[id] = photos.slots?.[id] ?? null;
  for (const [id, v] of Object.entries(photos.slots ?? {})) if (!ids.includes(id) && v !== null) notes.push(`data/photos.json: dropped slot "${id}" (was ${v})`);

  return {
    files: {
      "scripts/lib/copy-slots.json": pretty(copyList),
      "scripts/lib/photo-slots.json": pretty(photoList),
      "scripts/lib/seo-pages.json": pretty(seoList),
      "data/copy.json": pretty(newCopy),
      "data/seo.json": pretty(newSeo),
      "data/photos.json": pretty(newPhotos),
    },
    notes,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { files, notes } = plan();
  const check = process.argv.includes("--check");
  const stale = [];
  for (const [rel, text] of Object.entries(files)) {
    // --check looks at the three lists only: the data files' keys are checked by their validators, and their formatting is
    // whatever the shop system wrote.
    if (check && rel.startsWith("data/")) continue;
    const cur = existsSync(p(rel)) ? readFileSync(p(rel), "utf8") : "";
    if (cur === text) continue;
    stale.push(rel);
    if (!check) writeFileSync(p(rel), text);
  }
  for (const n of notes) console.log(n);
  if (check) {
    if (stale.length) {
      console.error(`slot lists out of step with data/services.json and content/treatments/: ${stale.join(", ")}. Run node scripts/sync-slots.mjs and commit.`);
      process.exit(1);
    }
    console.log("slot lists are in step");
  } else console.log(stale.length ? `wrote ${stale.join(", ")}` : "slot lists already in step");
}
