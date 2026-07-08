# Miles Away Blog — Publishing Guide

How new blog posts and ads get added. The site is plain static HTML on
GitHub Pages (repo `proviewmedia/milesawayblog`) — push to `main` and it
auto-deploys to milesawayblog.com in about a minute.

---

## Adding a blog post

**The easy way (recommended):** hand Melvin's draft — a Google Doc, a
note, a voice memo transcript, whatever — to Claude and say "post this."
Claude does every step below and pushes it live.

**What actually happens (the standard, every time):**

1. **Create the file** — copy `_TEMPLATE_post.html` → `posts/<slug>.html`
   (slug = short-kebab-case, e.g. `tokyo-guide.html`).
2. **Fill the `{{PLACEHOLDERS}}`** in the template header:
   title, description, keywords, category, hero image, date, location.
   - Category must be one of: **Destinations, Gear, Reviews, Travel Tips,
     Personal Care, Photography**.
   - Date format: ISO `2026-07-08` and human `July 8, 2026`.
3. **Write the body** using only these blocks: `<p>`, `<h2>`,
   `<ul><li>`, `<div class="pullquote">`, `<img class="inline-img">`,
   and one `<div class="ad-slot" data-format="inline"></div>` a couple
   paragraphs in.
4. **Wire it into the site** (so it's reachable + indexed):
   - Add a card to **`archive.html`** (top of the grid — newest first).
   - Add a card to **`index.html`** if it should be featured on the homepage.
   - Add a `<url>` entry to **`sitemap.xml`**.
5. **Push** — commit and `git push origin main`.

**Consistency rules (don't break these):**
- Never change the nav, footer, fonts, colors, or borders in the template.
- Every post is light-mode, uses Fraunces (headings) + DM Sans (body),
  and the orange accent `#E8421A`.
- Nav is identical on every page: All Stories · Destinations ·
  Gear & Reviews · Travel Tips · About · Contact.

---

## Adding or changing an ad

All partnership/affiliate ads live in **one file: `ads.js`**. Edit the
`ADS` array at the top — add an object, change a URL, or flip `active`
to `false` to pause one. It updates on every page automatically.

Ad placement uses `<div class="ad-slot"></div>` markers, which already
exist on every content page (posts, homepage, category pages). You don't
touch the pages to change an ad — only `ads.js`.

Ads intentionally do **not** appear on `contact.html` or `privacy.html`.

---

## Quick reference

| Task | File(s) to touch |
| --- | --- |
| New post | `_TEMPLATE_post.html` → `posts/<slug>.html`, `archive.html`, `index.html`, `sitemap.xml` |
| Change an ad | `ads.js` only |
| Edit nav / footer everywhere | every page (ask Claude — it scripts this) |
| Contact details | `contact.html`, footers |
