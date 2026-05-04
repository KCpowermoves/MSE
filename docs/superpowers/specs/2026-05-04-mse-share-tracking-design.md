# MSE Share-Tracking — Design

**Date:** 2026-05-04
**Status:** Implemented

## Goal

Extend the existing `?an=` agent-tracking convention so customers and business contacts who share Maryland Smart Energy blog posts get attribution credit when their share produces a lead.

## Background

The site already had two `?an=` flows:

1. **`/0deposit/`** — reads `?an=<slug>` (or `mse_an` from sessionStorage), looks up the slug in `0deposit/agents.json` (22 sales agents), and personalizes the offer page hero/sub/CTA. Slugs use **underscores** (e.g. `mitch_fischler`).
2. **`/contact.html`** — reads `?an=` and `?offer=`, persists both to sessionStorage, and populates hidden form fields `agent_name` / `offer_type` for lead attribution. The Paperform embed (`prefill-inherit`) reads URL params directly into form fields.

Neither flow worked on blog posts. A customer like Crystal at Hilton Garden Inn Bel Air could not share a blog post in a way that attributed any resulting lead back to her.

## What this adds

A site-wide share-tracking layer that:

1. **Reads `?an=<slug>`** from the URL or sessionStorage on every page, sanitizes it (`[a-z0-9_-]`), and persists it as `mse_an`.
2. **Rewrites every same-origin internal `<a href>`** to append `?an=<slug>`, so the slug rides along regardless of which link the visitor follows. Skips `tel:`, `mailto:`, `sms:`, `#anchor`, `javascript:`, external hosts, and links with `data-no-share-track`. Uses `MutationObserver` to catch dynamically added links (Paperform embeds, etc.).
3. **On blog posts only**, renders a soft warm card between the announce bar and the page hero:
   > 💬 **Crystal at Hilton Garden Inn Bel Air thought you'd find this useful.** Check out the special offer they have for you →
   - Registry hit (`referrers.json`) → `<First> at <Company>` framing.
   - No registry hit → free-form: title-case the slug, no company line.
   - "Special offer" link points to `/0deposit/?an=<slug>`.
   - Dismissible × button; dismissal stored in sessionStorage as `mse_an_banner_dismissed`.

## Files

| File | Purpose |
| --- | --- |
| `share-tracking.js` | Single shared client script. Detects blog posts by pathname (`/blog/<slug>.html`, excluding `/blog.html`). Loads `referrers.json` only when a banner is being rendered. |
| `share-tracking.css` | Banner styles only. Brand red (`#C8102E`) left border, cream gradient background, Barlow display font for the name, Source Sans body. Mobile breakpoint at 720px. |
| `referrers.json` | `{ referrers: { <slug>: { name, company, title? } } }`. Hand-edited. Empty by default. |
| `apply-share-tracking.mjs` | One-off (idempotent) installer that adds the `<link>` + `<script>` tags before `</head>` in every site HTML file. Skips `node_modules`, `current site`, `docs`, `admin`, `game`. Re-run safely after adding new pages. |
| `serve.mjs` | Local dev server on `:3010` (env `PORT` overrides). Falls back to `404.html`. |

37 existing HTML files were modified by `apply-share-tracking.mjs` to load the script and stylesheet.

## How it interacts with existing flows

- **0deposit page** — Already reads `?an=` and `mse_an`. The new banner's offer link (`/0deposit/?an=<slug>`) drops the visitor straight into the existing personalized offer flow. No change to `0deposit/index.html` logic.
- **Contact page** — Already reads `?an=` from URL or `mse_an` from sessionStorage and writes to hidden `agent_name` field. New script writes to the same `mse_an` key, so values are interchangeable. No change to `contact.html` logic.
- **Paperform embed** (`prefill-inherit`) — Reads URL params from the host page. Because the new script rewrites internal hrefs to carry `?an=`, the visitor lands on `/0deposit/` or `/contact.html` with `?an=` already in the URL bar; Paperform picks it up automatically.

## Slug format

- Use **underscores** to match `0deposit/agents.json` (e.g. `crystal_smith`).
- The free-form fallback also splits on dashes (`-`) for safety.
- Sanitization strips everything outside `[a-z0-9_-]` and lowercases.

## Where the banner does NOT show

- Any page outside `/blog/<slug>.html` — homepage, services, contact, 0deposit, etc. The banner copy ("thought you'd find this useful") is article-flavored.
- The blog index (`/blog.html`) — it's a list, not an article.
- Pages where the visitor has dismissed the banner this session.
- Pages with no `?an=` (URL or sessionStorage).

Link rewriting still happens on every page when `?an=` is present — only the visual banner is blog-only.

## Out of scope (deliberately)

- Per-referrer click analytics. Could later POST a Sheets/HighLevel webhook from the script.
- Self-serve "get my share link" page for referrers.
- Admin/listing UI to generate share URLs (Kevin will hand-craft URLs by appending `?an=<slug>`).
- Reconciling the `agents.json` data shape (no `company` field) into `referrers.json`. They stay separate — sales agents vs. customer/contact referrers.
- Fixing `contact.html`'s `split('-')` (it should also split on `_` for the offer banner name display); pre-existing minor bug, unrelated to this work.

## Verification

Manual smoke checks performed:
- Blog post WITHOUT `?an=` → no banner.
- Blog post WITH `?an=crystal_smith` (no registry hit) → banner reads "Crystal Smith thought you'd find this useful."
- Blog post WITH `?an=_test_entry` (registry hit) → banner reads "Test at Sample Property Group thought you'd find this useful." (registry entry then removed.)
- Mobile viewport (390×800) → banner stacks cleanly with dismiss × in top-right corner.
- `/contact.html?an=crystal_smith&offer=0deposit` → no share banner; existing offer banner shows; hidden `agent_name` and `offer_type` populated; nav `Schedule` CTA href rewritten to `/pricing.html?an=crystal_smith`.
- Homepage with `?an=` → no share banner; sessionStorage stored; internal hrefs rewritten.

## Adding a new referrer (workflow)

1. Open `referrers.json`.
2. Add an entry under `referrers`, e.g.:
   ```json
   "crystal_smith": {
     "name": "Crystal Smith",
     "company": "Hilton Garden Inn Bel Air"
   }
   ```
3. Hand the referrer their share URL by appending `?an=<slug>` to any blog post URL — e.g. `https://mdsmartenergy.com/blog/maryland-beps-compliance-guide.html?an=crystal_smith`.
