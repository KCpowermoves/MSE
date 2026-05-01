# MSE Careers Page — Design Spec

**Date:** 2026-05-01
**Status:** Approved by Kevin (design) — pending implementation plan
**Owner:** Kevin Hoffberg

## Goal

Add a careers section to mdsmartenergy.com that lets MSE recruit field
technicians, field sales reps, cross-trained sales+service techs, and a
senior management / field manager. Visitors should be able to apply
end-to-end without leaving the site, and applications should land in
HighLevel + a careers inbox. Source content for role descriptions
comes from the existing internal recruiting deck
(`MSE Recruiting Deck/mec-recruitment/project/speaker-bullets.md`).

## Scope

**In scope:**
- New page at `/careers.html` matching existing site layout (sticky nav,
  announcement bar, footer).
- Homepage teaser section linking to `/careers.html`.
- Nav links added to desktop nav, mobile nav, and footer "Company"
  column.
- Application modal with file upload (resume).
- Backend API endpoint that uploads resume to Google Drive, creates a
  HighLevel contact + opportunity, and emails the careers inbox.
- Cross-link to existing Tune-Up Tech game at `/game.html`.

**Out of scope:**
- Changes to the existing recruiting deck.
- Building a candidate pipeline UI (HighLevel handles that).
- Creating the `careers@mdsmartenergy.com` mailbox (Kevin will set up
  the alias in Google Workspace before launch).
- Creating the new HighLevel "Careers" pipeline (Kevin will create it
  and pass the IDs).
- Onboarding flow / candidate portal post-application.

## Page structure

`/careers.html` — top to bottom:

### 1. Hero
- Full-width navy gradient background with subtle Maryland-map texture.
- Headline: **"Build a real career. In the field. In Maryland."**
- Subhead: "Paid training. Weekly pay. A real career path with one of
  Maryland's fastest-growing EmPOWER providers."
- Two CTAs: **"See open roles"** (anchors to roles section) and
  **"Watch the 20-min overview"** (links to existing recruiting deck;
  exact URL TBD by Kevin — fall back to anchor link to "Why MSE" if
  deck isn't yet public-facing).
- No per-unit pay numbers anywhere in the hero.

### 2. Why MSE — 4-card trust strip
Pulled from deck slides 3–5:
- **Paid training** — 2–4 weeks, hourly while you learn the field.
- **Weekly pay + commission** — paychecks every week, full
  reconciliation after utility reimbursement.
- **Maryland-built, Maryland-only** — not a national chain bolting on a
  side business.
- **Real career path** — Trainee → Field Tech → Sales & Service → Field
  Manager. Promote from within.

### 3. Career path ladder
Visual 4-stage diagram. Each stage shows title and a broad annual
earning range (no per-unit numbers). Each stage anchors to its matching
role card below.

| Stage | Title | Earning range (annual, high-side estimate) |
|---|---|---|
| 01 | Trainee | Hourly during 2–4 week paid training |
| 02 | Field Service Technician | $60,000 – $120,000 |
| 03 | Field & Sales Technician | $96,000 – $192,000 |
| 04 | Senior Manager / Field Manager | $150,000 – $250,000+ |

(The "Field Sales Representative" role lives parallel to Stage 02/03 —
shown as a separate card in the roles section. The ladder shows the
core promotion track.)

### 4. Open roles
Four expandable cards. Each card shows:
- Role title
- 1-paragraph summary
- "Day-to-day" bullets (3–5)
- Annual pay range (broad, no per-unit math)
- Requirements bullets
- Employment type (1099 / W-2)
- Location
- "Apply" button (opens modal; pre-fills "Role applying for")
- For Field Service Tech, Field & Sales Tech, and Field Manager: a
  small inline link "**See what a tune-up looks like →** Play
  Tune-Up Tech" pointing to `/game.html` (new tab).

#### Role 1 — Field Service Technician
- **Summary:** The install side of the operation. Show up, clean and
  tune commercial rooftop HVAC units, document the work, move to the
  next stop. No selling required — accounts are pre-set.
- **Day-to-day:** Service multiple units per stop. Photo
  documentation and paperwork on a phone. Real weather, real rooftops,
  real ladders.
- **Pay:** $60,000 – $120,000/yr. Weekly paychecks; full reconciliation
  after utility reimbursement (typically 6–8 weeks). Hourly during
  paid training.
- **Requirements:** MD driver's license · personal vehicle · 50+ lb
  lift · climb ladders · coachable. *No HVAC license required — we
  train you.*
- **Type:** Full-time field role · 1099
- **Location:** Maryland (BGE, Pepco, Delmarva, SMECO territories)

#### Role 2 — Field Sales Representative
- **Summary:** Open commercial accounts. Walk into offices, warehouses,
  restaurants, and hotels — explain the EmPOWER program, lock the
  relationship, hand the install to the tech crew. Most owners say yes
  because it costs them nothing.
- **Day-to-day:** No cold calls, no scripts. Door-to-door commercial
  outside sales. Build a book of accounts that re-qualifies every
  three years.
- **Pay:** $80,000 – $180,000/yr. Commission-based — earnings scale
  with the accounts you open. Weekly paychecks.
- **Requirements:** MD driver's license · vehicle · field /
  door-to-door / trades sales background preferred · self-driven ·
  bilingual a plus.
- **Type:** Full-time field role · 1099
- **Location:** Statewide Maryland

#### Role 3 — Field & Sales Technician *(cross-trained — top earners)*
- **Summary:** You sell *and* you service. Walk into a building, get
  the yes, do the tune-up on the spot, paperwork, next stop. Both
  install pay and sales bonus stack on the work you book yourself.
- **Day-to-day:** Mix of self-generated and dispatched work. This is
  Stage 03 of MSE's internal career ladder — the path most top
  earners come from.
- **Pay:** $96,000 – $192,000/yr. Top performers consistently clear
  the high end of the range.
- **Requirements:** Same as Field Service Tech, plus willingness to
  talk to building owners. Sales experience nice but not required —
  we train both sides.
- **Type:** Full-time field role · 1099
- **Location:** Statewide Maryland

#### Role 4 — Senior Manager / Field Manager
- **Summary:** You own a territory. Build the crew, ride along, train
  new techs, audit paperwork, and grow the book. Personal earnings
  plus team overrides.
- **Day-to-day:** Mix of in-field coaching, crew dispatch, and senior
  leadership work alongside the ops team.
- **Pay:** $150,000 – $250,000+/yr. Personal pay + team overrides.
- **Requirements:** 2+ years field service, sales, or
  trades-management background · MD driver's license · vehicle ·
  proven coaching/leadership · strong organization.
- **Type:** Full-time · W-2
- **Location:** Statewide Maryland — territory-based

### 5. Try the job before you apply — Tune-Up Tech game
- Heading: **"Curious what the work feels like? Play Tune-Up Tech."**
- One paragraph: the game is a simulation of the actual technician
  workflow — visit a building, tune up the units, document the job,
  move to the next stop. Same loop, every day.
- Visual: stylized preview card (screenshot of game) with red "Play
  the game →" button linking to `/game.html` in a new tab.
- Rationale for not embedding inline: keeps page weight down; existing
  `/game.html` already has the iframe + fullscreen UX.

### 6. What you'll need
- Quick checklist of universal requirements: MD driver's license,
  personal vehicle, 50+ lb lift, comfortable on rooftops/ladders, work
  ethic.
- Reassurance: *No HVAC license needed — we train you on everything.*
- Nice-to-haves callout: door-to-door / field sales · trades
  background · military/veteran · bilingual (Spanish a big plus).

### 7. Real talk
- Pulled from deck slide 9.
- Three honest framings:
  - It's a **field job** — rooftops, weather, ladders, no A/C between
    stops.
  - It's **commission-driven** — pay scales with output; top earners
    show up.
  - It's **self-driven** — gift if you have a work ethic, problem if
    you don't.
- Purpose: filter wrong-fit candidates and build trust with right-fit
  candidates.

### 8. CTA block
- Red navy-on-red CTA: **"Ready to apply?"** with single button
  opening the application modal.
- Secondary line: phone number `(301) 888-7090` for candidates who
  prefer to call.

### 9. Footer
- Site-standard footer.

## Homepage teaser

Insert a new section in `index.html` between "Our Services" and the
existing customer CTA block:
- Light gray (`#F5F5F5`) background to visually separate from the
  customer-acquisition flow.
- Heading: **"We're hiring across Maryland"**
- Subhead: 1–2 lines summarizing the opportunity (paid training,
  weekly pay, real career).
- Single CTA button: **"View open roles →"** linking to
  `/careers.html`.
- Compact — does not compete with primary customer CTAs.

## Navigation changes

- **Desktop nav (`index.html` and every page that shares the nav):**
  Add `<li><a href="careers.html">Careers</a></li>` between the FAQ
  and Contact entries.
- **Mobile nav:** Same insert in the mobile menu list.
- **Footer:** Add "Careers" to the "Company" column (or equivalent
  column on the existing footer).
- All pages that currently render the shared nav must be updated. The
  current pattern is per-file inline HTML — there is no shared partial
  — so the nav HTML needs to be updated in each top-level page during
  implementation. The implementation plan will enumerate the files.

## Application form & backend

### Form fields (modal — single form, role pre-filled)

Required:
- First name
- Last name
- Email
- Phone
- Role applying for (pre-selected from card; user can change)
- ZIP code or nearest county
- Years of relevant experience
- "Tell us about yourself" — short textarea (500 char max)
- Resume upload — PDF or DOCX, 10MB max
- Three yes/no eligibility checks:
  - Maryland driver's license? (yes/no)
  - Personal vehicle? (yes/no)
  - Comfortable on rooftops/ladders + 50+ lb lift? (yes/no)

Optional:
- "How did you hear about us?" dropdown (Indeed, LinkedIn, Facebook,
  Friend/Referral, Other)

### Backend architecture

Mirrors the existing `api/capture-lead.js` pattern.

**New endpoint:** `api/career-application.js`
- Accepts `multipart/form-data` POST.
- Validates required fields server-side.
- Uploads resume to Google Drive via new helper.
- Creates HighLevel contact + opportunity in the new "Careers"
  pipeline.
- Sends notification email to careers inbox.
- Returns `{ success: true, contactId }` on success, `{ error }` on
  failure.

**New helper:** `api/lib/google-drive.js`
- Reuses the same service account credentials already used by
  `api/lib/google-sheets.js` (`GOOGLE_SERVICE_ACCOUNT_EMAIL`,
  `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`).
- Creates its own `JWT` instance with Drive scope
  (`https://www.googleapis.com/auth/drive`) since the cached JWT in
  `google-sheets.js` is bound to the Sheets scope only. Match the
  scope and pattern already used by the `mse-field` app's Drive
  helper to keep behavior consistent across MSE properties.
- The service account must have **Manager** access on the existing
  Shared Drive (already true per `mse-field` setup).
- Function: `uploadResume({ buffer, fileName, mimeType, role })` →
  uploads to subfolder `{Role}` under the parent folder identified by
  `CAREERS_DRIVE_FOLDER_ID`. File is named
  `{ISO-timestamp}-{First Last}-{role}.{ext}` to keep the folder
  legible.
- If the per-role subfolder does not exist, the helper creates it and
  caches the ID for the lifetime of the function instance.
- Returns the Drive file ID and a shareable view link
  (`webViewLink`).
- The parent "Careers Applications" folder must exist inside the
  Shared Drive ahead of time (Kevin creates it manually) and the
  folder ID stored as `CAREERS_DRIVE_FOLDER_ID`.

**HighLevel integration:**
- New pipeline ID + stage ID stored as env vars
  (`GHL_CAREERS_PIPELINE_ID`, `GHL_CAREERS_STAGE_NEW`).
- Tags applied: `["Career Application", "<Role>"]`.
- Custom fields on contact:
  - `role_applying_for`
  - `years_experience`
  - `zip_or_county`
  - `has_md_license`
  - `has_vehicle`
  - `comfortable_field_work`
  - `referral_source`
  - `resume_url` (the Drive view link)
- Opportunity name format:
  `"{First Last} — {Role}"`.

**Email alert:**
- New helper or inline `nodemailer`/Resend/SendGrid call (Kevin to
  confirm preferred provider; default assumption is whatever the rest
  of MSE already uses — if nothing exists, use SMTP via
  `nodemailer` with credentials in env vars).
- Recipient: `process.env.CAREERS_ALERT_EMAIL`, defaults to
  `careers@mdsmartenergy.com`.
- Subject: `New career application — {Role} — {First Last}`
- Body: all form fields, plus the resume Drive link, plus a HighLevel
  deep link to the new contact (if practical).

### Environment variables (additions)

Add to `.env.example` and Vercel production env:
- `GHL_CAREERS_PIPELINE_ID` — HighLevel pipeline UUID (Kevin creates).
- `GHL_CAREERS_STAGE_NEW` — Stage UUID for "New Application".
- `CAREERS_DRIVE_FOLDER_ID` — Drive folder ID for "Careers
  Applications" inside the existing Shared Drive.
- `CAREERS_ALERT_EMAIL` — Comma-separated list of alert recipients.
  Defaults to `careers@mdsmartenergy.com`.
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` (or whichever
  email-provider env vars Kevin chooses) if no email sender exists in
  the current codebase.

### Success state

In-modal confirmation panel:
- Headline: "Thanks — we got your application."
- Subline: "We review every application personally. Expect a text or
  call within 1 business day to book your 1-on-1."
- Button: "Close" (returns to careers page).

### Error handling

- Validation errors → field-level inline errors, modal stays open.
- Network or backend errors → general error banner inside modal:
  "Something broke on our end. Please try again, or email
  careers@mdsmartenergy.com directly."
- Resume upload partial failure → return error; do not push partial
  contact to HighLevel.

## Brand & visual style

- Use brand tokens from `brand_assets/BRAND_GUIDE.md`:
  - Maryland Red `#C8102E`, Gold `#F4A11D`, Navy `#1A2332`, Light
    Gray `#F5F5F5`.
  - Inter / Barlow font pairing already established in existing pages.
- No default Tailwind blue/indigo, no flat shadows, no
  `transition-all` (per project CLAUDE.md anti-generic guardrails).
- Spring-style easing on hover/active states.
- Image treatments: gradient overlay + mix-blend-multiply on any
  photography (per CLAUDE.md).

## Components / files touched

**New files:**
- `careers.html` (root) — the careers page itself.
- `api/career-application.js` — new backend endpoint.
- `api/lib/google-drive.js` — new Drive upload helper.

**Modified files (nav + footer updates):**
- `index.html` (homepage — also gets the teaser section)
- `about.html`
- `contact.html`
- `faq.html`
- `blog.html`
- `pricing.html`
- `empower-maryland.html`
- `bge-energy-efficiency.html`
- `pepco-energy-efficiency.html`
- `delmarva-energy-efficiency.html`
- `smeco-energy-efficiency.html`
- `services/hvac-tune-up.html`
- `services/building-tune-up.html`
- `services/lighting.html`
- `services/energy-supply.html`
- `services/community-solar.html`
- `services/benchmarking.html`
- `404.html` (if it shares the nav)
- `terms.html`, `privacy.html` (if they share the nav)
- `package.json` — add a multipart parser (`busboy` or `formidable`)
  and Drive Files API methods. `googleapis` is already a dep.
- `.env.example` — document the new env vars.

The implementation plan will confirm which of these actually share the
nav; there may be older pages that use a different layout.

## Validation / acceptance criteria

- Careers page renders correctly at `/careers.html` on desktop and
  mobile (≤768px); matches MSE brand.
- Nav link to Careers visible on every top-level page (desktop +
  mobile).
- Homepage teaser section visible on `index.html` between Services and
  the existing customer CTA block.
- Each role card opens the application modal with the correct role
  pre-filled.
- Submitting a complete application:
  1. Uploads the resume to the correct Drive folder (one subfolder per
     role).
  2. Creates a new HighLevel contact + opportunity in the Careers
     pipeline with correct tags and custom fields.
  3. Sends an email alert to `careers@mdsmartenergy.com` with all
     fields and the resume Drive link.
  4. Shows the success state in the modal.
- All form validation works client-side and server-side.
- Per-unit dollar amounts do **not** appear anywhere on the careers
  page or homepage teaser.
- Tune-Up Tech game cross-link appears on three roles (Field Service
  Tech, Field & Sales Tech, Senior Manager) and in the "Try the job"
  section.
- Page passes a screenshot review against the brand guide (compared
  via `node screenshot.mjs http://localhost:3000/careers.html`).

## Open items for Kevin (before launch)

1. Confirm or set up `careers@mdsmartenergy.com` mailbox/alias in
   Google Workspace.
2. Create the new "Careers" pipeline in HighLevel (single stage:
   "New Application") and provide the pipeline + stage UUIDs.
3. Create the HighLevel custom fields used in the spec
   (`role_applying_for`, `years_experience`, `zip_or_county`,
   `has_md_license`, `has_vehicle`, `comfortable_field_work`,
   `referral_source`, `resume_url`) — or confirm existing field keys
   we should reuse instead.
4. Create a "Careers Applications" folder inside the existing Shared
   Drive and provide its folder ID.
5. Confirm preferred email-sending mechanism (existing SMTP, Resend,
   SendGrid, etc.) — if the codebase has no email sender today,
   default to Resend (single SDK, fast Vercel integration).
6. Confirm whether the recruiting deck URL exists publicly — if so,
   provide the URL for the hero "Watch the 20-min overview" CTA.
   Otherwise the implementation will drop that secondary CTA.
