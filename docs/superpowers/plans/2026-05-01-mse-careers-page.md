# MSE Careers Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/careers.html` page to mdsmartenergy.com with four role cards, a Tune-Up Tech game cross-link, an end-to-end application modal that uploads resumes to Google Drive and pushes contacts to HighLevel, plus a homepage teaser and nav links across the site.

**Architecture:** Net-new static HTML page following the existing inline-CSS / per-file-chrome pattern (no shared partials). Net-new Vercel serverless API route at `api/career-application.js` mirroring `api/capture-lead.js`. Net-new helper at `api/lib/google-drive.js` reusing the existing service-account credentials with the Drive scope. Email via Resend (single SDK, simplest Vercel integration).

**Tech Stack:** Static HTML + inline CSS + Tailwind CDN (page). Node 18+ Vercel serverless functions (commonjs), `googleapis` (already installed), `busboy` (multipart parsing — to add), `resend` (email — to add). Pure-logic unit tests via `node --test` (built in to Node 18+).

**Reference spec:** [`docs/superpowers/specs/2026-05-01-mse-careers-page-design.md`](../specs/2026-05-01-mse-careers-page-design.md)

**Working directory:** All paths in this plan are relative to `c:/Users/kevin/OneDrive/Desktop/ClaudeCode/MSE/` unless prefixed otherwise.

**Local dev:**
- Static dev server runs from the parent `ClaudeCode/` directory: `cd .. && node serve.mjs` → MSE pages at `http://localhost:3001/MSE/<file>.html`.
- API endpoints only run under `vercel dev` (run from the `MSE/` directory).
- Screenshots: `cd .. && node screenshot.mjs http://localhost:3001/MSE/careers.html careers-vN`.

---

## File Structure

**New files:**
- `careers.html` — the careers page.
- `api/career-application.js` — backend endpoint (multipart POST).
- `api/lib/google-drive.js` — Drive upload helper (creates per-role subfolders, returns `webViewLink`).
- `api/lib/career-email.js` — email-alert helper using Resend.
- `api/lib/career-validation.js` — pure validation functions (unit-tested).
- `tests/career-validation.test.js` — `node --test` unit tests.
- `.env.example` — document required env vars.

**Modified files (nav + footer updates only — chrome lives inline in each file):**
- `index.html` (nav + footer + new homepage teaser section)
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
- `404.html`, `terms.html`, `privacy.html` *(check during Task 17 — only modify if they share the nav)*
- `package.json` — add `busboy` + `resend`.
- `sitemap.xml` — add `/careers.html`.

**Footer column note:** The current footer has Services / Resources / Contact columns — there is no "Company" column. The implementation adds the Careers link to the **Resources** column on each page (less invasive than adding a fourth column on every page).

---

## Phase 1 — Backend foundations

### Task 1: Install dependencies and document env vars

**Files:**
- Modify: `package.json`
- Create: `.env.example`

- [ ] **Step 1: Install new deps**

Run from `MSE/`:

```bash
npm install busboy resend
```

Expected: `package.json` now lists `busboy` and `resend` under `dependencies`. `package-lock.json` updated.

- [ ] **Step 2: Create `.env.example`**

Create `MSE/.env.example` with this exact content:

```env
# HighLevel (existing — used by capture-lead.js)
GHL_API_TOKEN=
GHL_LOCATION_ID=

# HighLevel — Careers pipeline (NEW — Kevin must create the pipeline in HighLevel and paste UUIDs here)
GHL_CAREERS_PIPELINE_ID=
GHL_CAREERS_STAGE_NEW=

# Google service account (existing — used by capture-lead.js / google-sheets.js)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=

# Google Drive — Careers (NEW — folder ID for "Careers Applications" inside the existing Shared Drive)
CAREERS_DRIVE_FOLDER_ID=

# Email alerts via Resend (NEW)
RESEND_API_KEY=
CAREERS_ALERT_EMAIL=careers@mdsmartenergy.com

# Existing residential / sheet vars (unchanged)
RESIDENTIAL_SHEET_BRYAN=
RESIDENTIAL_SHEET_AGHS=
RESIDENTIAL_SHEET_WAITLIST=

# Stripe (existing)
STRIPE_SECRET_KEY=
```

- [ ] **Step 3: Verify**

```bash
node -e "const pkg=require('./package.json'); console.log(pkg.dependencies);"
```

Expected output includes `busboy`, `resend`, `googleapis`, `stripe`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add busboy + resend deps and document careers env vars"
```

---

### Task 2: Build form-validation helper (pure logic + unit tests)

**Files:**
- Create: `api/lib/career-validation.js`
- Create: `tests/career-validation.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/career-validation.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateApplication, ROLES } = require('../api/lib/career-validation');

test('rejects missing first name', () => {
  const result = validateApplication({ lastName: 'Doe', email: 'a@b.com', phone: '301-555-1234', role: 'field-service-tech', zip: '21201', yearsExperience: '2', tellUsAboutYou: 'hi', hasMdLicense: 'yes', hasVehicle: 'yes', comfortableFieldWork: 'yes' });
  assert.equal(result.ok, false);
  assert.match(result.errors.firstName, /required/i);
});

test('rejects invalid email', () => {
  const result = validateApplication({ firstName: 'Jane', lastName: 'Doe', email: 'not-an-email', phone: '301-555-1234', role: 'field-service-tech', zip: '21201', yearsExperience: '2', tellUsAboutYou: 'hi', hasMdLicense: 'yes', hasVehicle: 'yes', comfortableFieldWork: 'yes' });
  assert.equal(result.ok, false);
  assert.match(result.errors.email, /valid email/i);
});

test('rejects unknown role', () => {
  const result = validateApplication({ firstName: 'Jane', lastName: 'Doe', email: 'a@b.com', phone: '301-555-1234', role: 'made-up-role', zip: '21201', yearsExperience: '2', tellUsAboutYou: 'hi', hasMdLicense: 'yes', hasVehicle: 'yes', comfortableFieldWork: 'yes' });
  assert.equal(result.ok, false);
  assert.match(result.errors.role, /role/i);
});

test('rejects ZIP that is not 5 digits', () => {
  const result = validateApplication({ firstName: 'Jane', lastName: 'Doe', email: 'a@b.com', phone: '301-555-1234', role: 'field-service-tech', zip: '212', yearsExperience: '2', tellUsAboutYou: 'hi', hasMdLicense: 'yes', hasVehicle: 'yes', comfortableFieldWork: 'yes' });
  assert.equal(result.ok, false);
  assert.match(result.errors.zip, /zip/i);
});

test('rejects tellUsAboutYou over 500 chars', () => {
  const longText = 'x'.repeat(501);
  const result = validateApplication({ firstName: 'Jane', lastName: 'Doe', email: 'a@b.com', phone: '301-555-1234', role: 'field-service-tech', zip: '21201', yearsExperience: '2', tellUsAboutYou: longText, hasMdLicense: 'yes', hasVehicle: 'yes', comfortableFieldWork: 'yes' });
  assert.equal(result.ok, false);
  assert.match(result.errors.tellUsAboutYou, /500/);
});

test('accepts valid application', () => {
  const result = validateApplication({ firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '301-555-1234', role: 'field-and-sales-tech', zip: '21201', yearsExperience: '5', tellUsAboutYou: 'I have HVAC and sales experience.', hasMdLicense: 'yes', hasVehicle: 'yes', comfortableFieldWork: 'yes', referralSource: 'Indeed' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, {});
});

test('ROLES list contains the four role slugs', () => {
  assert.deepEqual(ROLES.map(r => r.slug).sort(), [
    'field-and-sales-tech',
    'field-manager',
    'field-sales-rep',
    'field-service-tech',
  ]);
});

test('every role slug has a display name', () => {
  for (const r of ROLES) {
    assert.ok(r.displayName, `role ${r.slug} missing displayName`);
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tests/career-validation.test.js
```

Expected: All 8 tests fail with "Cannot find module '../api/lib/career-validation'".

- [ ] **Step 3: Implement validation helper**

Create `api/lib/career-validation.js`:

```javascript
const ROLES = [
  { slug: 'field-service-tech',    displayName: 'Field Service Technician' },
  { slug: 'field-sales-rep',       displayName: 'Field Sales Representative' },
  { slug: 'field-and-sales-tech',  displayName: 'Field & Sales Technician' },
  { slug: 'field-manager',         displayName: 'Senior Manager / Field Manager' },
];

const ROLE_SLUGS = new Set(ROLES.map(r => r.slug));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE = /^\d{5}$/;
const PHONE_RE = /^[\d().\-+\s]{7,}$/;

function validateApplication(input) {
  const errors = {};

  if (!input.firstName || !String(input.firstName).trim()) errors.firstName = 'First name is required.';
  if (!input.lastName || !String(input.lastName).trim()) errors.lastName = 'Last name is required.';

  if (!input.email || !EMAIL_RE.test(String(input.email).trim())) errors.email = 'Enter a valid email address.';
  if (!input.phone || !PHONE_RE.test(String(input.phone).trim())) errors.phone = 'Enter a valid phone number.';

  if (!input.role || !ROLE_SLUGS.has(input.role)) errors.role = 'Pick a role.';

  if (!input.zip || !ZIP_RE.test(String(input.zip).trim())) errors.zip = 'Enter a 5-digit ZIP code.';

  if (input.yearsExperience === undefined || input.yearsExperience === null || input.yearsExperience === '') {
    errors.yearsExperience = 'Years of experience is required.';
  } else if (Number.isNaN(Number(input.yearsExperience))) {
    errors.yearsExperience = 'Years of experience must be a number.';
  }

  if (!input.tellUsAboutYou || !String(input.tellUsAboutYou).trim()) {
    errors.tellUsAboutYou = 'Tell us about yourself.';
  } else if (String(input.tellUsAboutYou).length > 500) {
    errors.tellUsAboutYou = 'Keep it under 500 characters.';
  }

  for (const field of ['hasMdLicense', 'hasVehicle', 'comfortableFieldWork']) {
    if (input[field] !== 'yes' && input[field] !== 'no') {
      errors[field] = 'Answer yes or no.';
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

function getRoleDisplayName(slug) {
  const r = ROLES.find(x => x.slug === slug);
  return r ? r.displayName : slug;
}

module.exports = { ROLES, validateApplication, getRoleDisplayName };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test tests/career-validation.test.js
```

Expected: All 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add api/lib/career-validation.js tests/career-validation.test.js
git commit -m "feat(careers): add application validation helper with unit tests"
```

---

### Task 3: Build Google Drive upload helper

**Files:**
- Create: `api/lib/google-drive.js`

- [ ] **Step 1: Write the helper**

Create `api/lib/google-drive.js`:

```javascript
const { google } = require('googleapis');

let cachedAuth = null;
let cachedDrive = null;
const subfolderCache = new Map();

function getAuth() {
  if (cachedAuth) return cachedAuth;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
  const key = rawKey.replace(/\\n/g, '\n');
  cachedAuth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  return cachedAuth;
}

function getDrive() {
  if (cachedDrive) return cachedDrive;
  cachedDrive = google.drive({ version: 'v3', auth: getAuth() });
  return cachedDrive;
}

async function findOrCreateRoleFolder(parentId, roleSlug) {
  const cacheKey = `${parentId}:${roleSlug}`;
  if (subfolderCache.has(cacheKey)) return subfolderCache.get(cacheKey);

  const drive = getDrive();
  const safeName = roleSlug.replace(/[^a-z0-9-]/gi, '');
  const q = `name='${safeName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const list = await drive.files.list({
    q,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: 'allDrives'
  });

  let folderId = list.data.files?.[0]?.id;
  if (!folderId) {
    const created = await drive.files.create({
      requestBody: {
        name: safeName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      },
      fields: 'id',
      supportsAllDrives: true
    });
    folderId = created.data.id;
  }

  subfolderCache.set(cacheKey, folderId);
  return folderId;
}

function sanitizeFileNamePart(s) {
  return String(s || '').replace(/[^a-z0-9-]/gi, '_').slice(0, 60);
}

/**
 * Upload a resume buffer to the Careers Applications folder, under a per-role
 * subfolder. Returns { fileId, webViewLink }.
 */
async function uploadResume({ buffer, fileName, mimeType, role, applicantName }) {
  const parentId = process.env.CAREERS_DRIVE_FOLDER_ID;
  if (!parentId) throw new Error('CAREERS_DRIVE_FOLDER_ID is not set');
  if (!buffer || !buffer.length) throw new Error('Resume buffer is empty');

  const drive = getDrive();
  const roleFolderId = await findOrCreateRoleFolder(parentId, role);

  const ext = (fileName.match(/\.[a-z0-9]+$/i) || [''])[0];
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const finalName = `${ts}-${sanitizeFileNamePart(applicantName)}-${sanitizeFileNamePart(role)}${ext}`;

  const { Readable } = require('stream');
  const stream = Readable.from(buffer);

  const created = await drive.files.create({
    requestBody: {
      name: finalName,
      parents: [roleFolderId]
    },
    media: { mimeType, body: stream },
    fields: 'id, webViewLink',
    supportsAllDrives: true
  });

  return { fileId: created.data.id, webViewLink: created.data.webViewLink };
}

module.exports = { uploadResume };
```

- [ ] **Step 2: Smoke-test the helper**

Create a one-off smoke script (DO NOT commit) at `MSE/_smoke-drive.js`:

```javascript
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { uploadResume } = require('./api/lib/google-drive');

(async () => {
  const buffer = Buffer.from('This is a smoke-test resume PDF placeholder.', 'utf8');
  const result = await uploadResume({
    buffer,
    fileName: 'smoke-test.txt',
    mimeType: 'text/plain',
    role: 'field-service-tech',
    applicantName: 'Smoke Test'
  });
  console.log('uploaded:', result);
})().catch(e => { console.error(e); process.exit(1); });
```

Run:

```bash
node _smoke-drive.js
```

Expected: prints `uploaded: { fileId: '...', webViewLink: 'https://drive.google.com/...' }`. Verify the file appears in the Shared Drive under `Careers Applications/field-service-tech/`.

If `CAREERS_DRIVE_FOLDER_ID` is not yet set in `.env.local`, this step is **blocked** — note the blocker, ask Kevin to provide the folder ID, then retry. Do not skip the smoke test.

- [ ] **Step 3: Delete the smoke script**

```bash
rm _smoke-drive.js
```

- [ ] **Step 4: Commit**

```bash
git add api/lib/google-drive.js
git commit -m "feat(careers): add Google Drive upload helper for resume uploads"
```

---

### Task 4: Build email-alert helper

**Files:**
- Create: `api/lib/career-email.js`

- [ ] **Step 1: Write the helper**

Create `api/lib/career-email.js`:

```javascript
const { Resend } = require('resend');

let cachedClient = null;
function getClient() {
  if (cachedClient) return cachedClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  cachedClient = new Resend(key);
  return cachedClient;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderApplicationEmail(payload) {
  const rows = [
    ['Role',                    payload.roleDisplayName],
    ['Name',                    `${payload.firstName} ${payload.lastName}`],
    ['Email',                   payload.email],
    ['Phone',                   payload.phone],
    ['ZIP / county',            payload.zip],
    ['Years of experience',     payload.yearsExperience],
    ['MD driver’s license', payload.hasMdLicense],
    ['Personal vehicle',        payload.hasVehicle],
    ['Comfortable field work',  payload.comfortableFieldWork],
    ['Referral source',         payload.referralSource || '—'],
    ['Resume',                  payload.resumeUrl ? `<a href="${escapeHtml(payload.resumeUrl)}">Open in Drive</a>` : '—'],
    ['HighLevel contact ID',    payload.contactId || '—'],
  ];

  const tableRows = rows.map(([k, v]) =>
    `<tr><td style="padding:6px 12px;color:#888;font-family:Barlow,sans-serif;font-weight:600;">${escapeHtml(k)}</td><td style="padding:6px 12px;">${k === 'Resume' ? v : escapeHtml(v)}</td></tr>`
  ).join('');

  const html = `
<div style="font-family:Source Sans 3,Arial,sans-serif;max-width:640px">
  <h2 style="font-family:Barlow,sans-serif;color:#1A2332;border-bottom:2px solid #C8102E;padding-bottom:8px">
    New career application — ${escapeHtml(payload.roleDisplayName)}
  </h2>
  <table style="border-collapse:collapse;width:100%">${tableRows}</table>
  <h3 style="font-family:Barlow,sans-serif;color:#1A2332;margin-top:24px">About the applicant</h3>
  <p style="white-space:pre-wrap;line-height:1.6">${escapeHtml(payload.tellUsAboutYou)}</p>
</div>`;

  return html;
}

async function sendApplicationAlert(payload) {
  const recipientsRaw = process.env.CAREERS_ALERT_EMAIL || 'careers@mdsmartenergy.com';
  const recipients = recipientsRaw.split(',').map(s => s.trim()).filter(Boolean);
  const fromAddr = process.env.RESEND_FROM_EMAIL || 'Careers <careers@mdsmartenergy.com>';

  const subject = `New career application — ${payload.roleDisplayName} — ${payload.firstName} ${payload.lastName}`;
  const html = renderApplicationEmail(payload);

  const { data, error } = await getClient().emails.send({
    from: fromAddr,
    to: recipients,
    reply_to: payload.email,
    subject,
    html,
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
  return data;
}

module.exports = { sendApplicationAlert, renderApplicationEmail };
```

- [ ] **Step 2: Verify rendered HTML compiles**

```bash
node -e "const { renderApplicationEmail } = require('./api/lib/career-email'); console.log(renderApplicationEmail({ roleDisplayName:'Field Service Technician', firstName:'Jane', lastName:'Doe', email:'jane@example.com', phone:'301-555-1234', zip:'21201', yearsExperience:'5', hasMdLicense:'yes', hasVehicle:'yes', comfortableFieldWork:'yes', referralSource:'Indeed', resumeUrl:'https://drive.google.com/x', contactId:'abc123', tellUsAboutYou:'I love HVAC.' }).slice(0,200));"
```

Expected: prints the first 200 chars of valid HTML starting with `<div style="font-family:...`.

- [ ] **Step 3: Commit**

```bash
git add api/lib/career-email.js
git commit -m "feat(careers): add Resend-based email-alert helper"
```

---

### Task 5: Build the `career-application` API endpoint

**Files:**
- Create: `api/career-application.js`

- [ ] **Step 1: Write the endpoint**

Create `api/career-application.js`:

```javascript
const Busboy = require('busboy');
const { validateApplication, getRoleDisplayName } = require('./lib/career-validation');
const { uploadResume } = require('./lib/google-drive');
const { sendApplicationAlert } = require('./lib/career-email');

const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_RESUME_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const fields = {};
    let resumeBuffer = null;
    let resumeFileName = null;
    let resumeMime = null;
    let resumeTooBig = false;
    let resumeBadType = false;

    const bb = Busboy({
      headers: req.headers,
      limits: { fileSize: MAX_RESUME_BYTES, files: 1 }
    });

    bb.on('field', (name, val) => { fields[name] = val; });

    bb.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      if (name !== 'resume') {
        file.resume();
        return;
      }
      if (!ALLOWED_RESUME_MIME.has(mimeType)) {
        resumeBadType = true;
        file.resume();
        return;
      }
      const chunks = [];
      file.on('data', c => chunks.push(c));
      file.on('limit', () => { resumeTooBig = true; });
      file.on('end', () => {
        if (!resumeTooBig && !resumeBadType) {
          resumeBuffer = Buffer.concat(chunks);
          resumeFileName = filename;
          resumeMime = mimeType;
        }
      });
    });

    bb.on('finish', () => resolve({ fields, resumeBuffer, resumeFileName, resumeMime, resumeTooBig, resumeBadType }));
    bb.on('error', reject);
    req.pipe(bb);
  });
}

async function ghl(path, body, token) {
  const res = await fetch(`https://services.leadconnectorhq.com${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    if (data?.meta?.contactId) return { contact: { id: data.meta.contactId } };
    throw new Error(JSON.stringify(data));
  }
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let parsed;
  try {
    parsed = await parseMultipart(req);
  } catch (e) {
    return res.status(400).json({ error: 'Could not parse the form. Please try again.' });
  }

  const { fields, resumeBuffer, resumeFileName, resumeMime, resumeTooBig, resumeBadType } = parsed;

  if (resumeTooBig) return res.status(413).json({ error: 'Resume is too large (10 MB max).' });
  if (resumeBadType) return res.status(415).json({ error: 'Resume must be a PDF or Word document.' });
  if (!resumeBuffer || !resumeBuffer.length) return res.status(400).json({ error: 'Please attach a resume.' });

  const validation = validateApplication(fields);
  if (!validation.ok) {
    return res.status(400).json({ error: 'Please fix the highlighted fields.', fieldErrors: validation.errors });
  }

  const roleDisplayName = getRoleDisplayName(fields.role);

  let resumeUrl = null;
  let contactId = null;

  try {
    const upload = await uploadResume({
      buffer: resumeBuffer,
      fileName: resumeFileName,
      mimeType: resumeMime,
      role: fields.role,
      applicantName: `${fields.firstName} ${fields.lastName}`
    });
    resumeUrl = upload.webViewLink;
  } catch (err) {
    console.error('career-application: drive upload failed:', err.message);
    return res.status(500).json({ error: 'Resume upload failed. Please try again.' });
  }

  try {
    const token = process.env.GHL_API_TOKEN;
    const locationId = process.env.GHL_LOCATION_ID;
    const pipelineId = process.env.GHL_CAREERS_PIPELINE_ID;
    const stageId = process.env.GHL_CAREERS_STAGE_NEW;

    const contactData = await ghl('/contacts/', {
      locationId,
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      phone: fields.phone,
      source: 'Careers Page',
      tags: ['Career Application', roleDisplayName],
      customFields: [
        { key: 'role_applying_for',      field_value: roleDisplayName },
        { key: 'years_experience',       field_value: String(fields.yearsExperience || '') },
        { key: 'zip_or_county',          field_value: String(fields.zip || '') },
        { key: 'has_md_license',         field_value: String(fields.hasMdLicense || '') },
        { key: 'has_vehicle',            field_value: String(fields.hasVehicle || '') },
        { key: 'comfortable_field_work', field_value: String(fields.comfortableFieldWork || '') },
        { key: 'referral_source',        field_value: String(fields.referralSource || '') },
        { key: 'resume_url',             field_value: resumeUrl || '' },
      ]
    }, token);

    contactId = contactData.contact?.id;
    if (!contactId) throw new Error('No contact ID returned from GHL');

    await ghl('/opportunities/', {
      locationId,
      pipelineId,
      pipelineStageId: stageId,
      contactId,
      name: `${fields.firstName} ${fields.lastName} — ${roleDisplayName}`,
      monetaryValue: 0,
      status: 'open'
    }, token);
  } catch (err) {
    console.error('career-application: HighLevel push failed:', err.message);
    // Continue — we already have the resume in Drive. Email is the safety net.
  }

  try {
    await sendApplicationAlert({
      roleDisplayName,
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      phone: fields.phone,
      zip: fields.zip,
      yearsExperience: fields.yearsExperience,
      hasMdLicense: fields.hasMdLicense,
      hasVehicle: fields.hasVehicle,
      comfortableFieldWork: fields.comfortableFieldWork,
      referralSource: fields.referralSource,
      tellUsAboutYou: fields.tellUsAboutYou,
      resumeUrl,
      contactId
    });
  } catch (err) {
    console.error('career-application: email alert failed:', err.message);
    // Do not fail the request — the application is recorded.
  }

  return res.status(200).json({ success: true, contactId });
};

module.exports.config = { api: { bodyParser: false } };
```

- [ ] **Step 2: Smoke-test with curl (requires `vercel dev`)**

In one terminal:

```bash
vercel dev
```

In another, build a sample PDF and POST it:

```bash
echo "Sample resume content" > /tmp/sample.pdf
curl -i -X POST http://localhost:3000/api/career-application \
  -F "firstName=Jane" \
  -F "lastName=Doe" \
  -F "email=jane@example.com" \
  -F "phone=301-555-1234" \
  -F "role=field-service-tech" \
  -F "zip=21201" \
  -F "yearsExperience=5" \
  -F "tellUsAboutYou=I have HVAC experience and am eager to learn the EmPOWER program." \
  -F "hasMdLicense=yes" \
  -F "hasVehicle=yes" \
  -F "comfortableFieldWork=yes" \
  -F "referralSource=Indeed" \
  -F "resume=@/tmp/sample.pdf;type=application/pdf"
```

Expected: HTTP 200 with `{"success":true,"contactId":"..."}`. Verify in HighLevel that a new contact appeared in the Careers pipeline. Verify resume in Drive subfolder. Verify email arrived at `careers@mdsmartenergy.com`.

If any of HighLevel / Drive / email is not yet provisioned (open items 1–5 in the spec), document the blocker and continue — the endpoint should still succeed at the stages that ARE provisioned because errors in HighLevel and email do not fail the request (only Drive failure does).

- [ ] **Step 3: Commit**

```bash
git add api/career-application.js
git commit -m "feat(careers): add multipart application endpoint with Drive + HighLevel + email"
```

---

## Phase 2 — Careers page

> The careers page is `careers.html` at the project root, structured as a single self-contained file matching the existing pattern (see `about.html` for the canonical chrome). Build it section-by-section, screenshotting after each major section.

### Task 6: Scaffold `careers.html` with shared chrome

**Files:**
- Create: `careers.html`

- [ ] **Step 1: Copy the chrome (head, nav, announcement bar, mobile nav, footer) from `about.html`**

Open `about.html` and `careers.html` side by side. Copy:
- Lines 1–9 of `about.html` (`<!DOCTYPE>` through `<title>`).
- Lines 19–22 (font preconnect + Tailwind CDN + tailwind config).
- The shared inline-CSS block for `.announce-bar`, `.site-header`, `nav`, `.nav-*`, `.dropdown-*`, `.mobile-*`, `footer`, `.footer-*` rules. (These are the chrome-only rules.)
- The full `<div class="site-header">...</div>` markup including the `<nav>` block, mobile nav, and announcement bar.
- The full `<footer>...</footer>` markup.

In the copied `<title>` and meta tags, change to:

```html
<title>Careers — Maryland Smart Energy</title>
<meta name="description" content="Join Maryland Smart Energy. Field tech, field sales, cross-trained sales+service, and senior management roles across BGE, Pepco, Delmarva, and SMECO territories. Paid training, weekly pay, real career path." />
<meta property="og:url" content="https://www.mdsmartenergy.com/careers.html" />
<meta property="og:title" content="Careers — Maryland Smart Energy" />
<meta property="og:description" content="Join Maryland Smart Energy. Field tech, field sales, cross-trained sales+service, and senior management roles across BGE, Pepco, Delmarva, and SMECO territories." />
```

- [ ] **Step 2: Add "Careers" to the desktop nav and mobile nav inside this file**

Inside the `.nav-links` `<ul>`, between the FAQ `<li>` and the Contact `<li>`, insert:

```html
<li><a href="careers.html" class="active" style="color:#C8102E">Careers</a></li>
```

Inside the mobile nav `<div class="mobile-nav">`, between the FAQ and Contact lines, insert:

```html
<a href="careers.html" style="color:#C8102E">Careers</a>
```

(Marking it active here makes the current page obvious. The other pages will get the same nav link without `class="active"` in Task 17.)

- [ ] **Step 3: Add "Careers" to the footer Resources column inside this file**

Inside the Resources column `<ul>` in the footer, after the FAQ entry, insert:

```html
<li><a href="careers.html">Careers</a></li>
```

- [ ] **Step 4: Add an empty `<main>` placeholder between the header and the footer**

```html
<main id="main">
  <!-- sections added in Tasks 7–15 -->
</main>
```

- [ ] **Step 5: Visual smoke-check**

Start the static dev server (from the project root one level up):

```bash
cd ..
node serve.mjs &
node screenshot.mjs http://localhost:3001/MSE/careers.html scaffold
```

Read the screenshot from `temporary screenshots/`. Expected: the same nav, announcement bar, and footer as `about.html`, with an empty page body.

- [ ] **Step 6: Commit**

```bash
git add careers.html
git commit -m "feat(careers): scaffold careers.html with shared nav and footer"
```

---

### Task 7: Add the hero section

**Files:**
- Modify: `careers.html` (inside `<main>`)

- [ ] **Step 1: Add hero CSS to the inline `<style>` block in `careers.html`**

Append these rules to the existing inline `<style>` block (just before `</style>`):

```css
/* Careers page — hero */
.careers-hero{position:relative;background:linear-gradient(135deg,#1A2332 0%,#243044 100%);color:#fff;padding:6rem 1.5rem 5rem;overflow:hidden}
.careers-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 20% 20%,rgba(244,161,29,.18),transparent 50%),radial-gradient(circle at 80% 80%,rgba(200,16,46,.15),transparent 55%);pointer-events:none}
.careers-hero::after{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4'><rect width='4' height='4' fill='%23ffffff' fill-opacity='0.02'/><circle cx='2' cy='2' r='0.5' fill='%23ffffff' fill-opacity='0.04'/></svg>");opacity:.5;pointer-events:none}
.careers-hero-inner{position:relative;z-index:1;max-width:920px;margin:0 auto;text-align:center}
.careers-hero-eyebrow{display:inline-flex;align-items:center;gap:.5rem;background:rgba(244,161,29,.12);border:1px solid rgba(244,161,29,.35);color:#F4A11D;font-family:'Barlow',sans-serif;font-weight:700;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;padding:.4rem .85rem;border-radius:100px;margin-bottom:1.5rem}
.careers-hero-eyebrow::before{content:'';width:7px;height:7px;border-radius:50%;background:#F4A11D;box-shadow:0 0 12px rgba(244,161,29,.7)}
.careers-hero h1{font-family:'Barlow',sans-serif;font-weight:900;font-size:clamp(2.5rem,5.5vw,4.25rem);line-height:1.05;letter-spacing:-.03em;margin:0 0 1.25rem;color:#fff}
.careers-hero h1 em{font-style:normal;color:#F4A11D}
.careers-hero p{font-size:clamp(1.0625rem,1.25vw,1.25rem);line-height:1.65;color:rgba(255,255,255,.78);max-width:680px;margin:0 auto 2.25rem}
.careers-hero-actions{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
.btn-careers-primary{display:inline-flex;align-items:center;gap:.5rem;background:#C8102E;color:#fff;font-family:'Barlow',sans-serif;font-weight:800;font-size:1rem;padding:.95rem 1.6rem;border-radius:8px;text-decoration:none;box-shadow:0 12px 32px -8px rgba(200,16,46,.5);transition:transform .12s cubic-bezier(.34,1.56,.64,1),box-shadow .12s}
.btn-careers-primary:hover{transform:translateY(-2px);box-shadow:0 18px 40px -10px rgba(200,16,46,.6)}
.btn-careers-primary:active{transform:translateY(0)}
.btn-careers-secondary{display:inline-flex;align-items:center;gap:.5rem;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);color:#fff;font-family:'Barlow',sans-serif;font-weight:700;font-size:1rem;padding:.95rem 1.6rem;border-radius:8px;text-decoration:none;transition:background .15s,transform .12s}
.btn-careers-secondary:hover{background:rgba(255,255,255,.12);transform:translateY(-1px)}
```

- [ ] **Step 2: Add the hero markup at the top of `<main>`**

```html
<section class="careers-hero">
  <div class="careers-hero-inner">
    <div class="careers-hero-eyebrow">Now Hiring — Maryland</div>
    <h1>Build a real career. <em>In the field.</em> In Maryland.</h1>
    <p>Paid training. Weekly pay. A real career path with one of Maryland's fastest-growing EmPOWER providers — not a gig, not a side hustle, not a national chain.</p>
    <div class="careers-hero-actions">
      <a href="#open-roles" class="btn-careers-primary">
        See open roles
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
      <a href="#why-mse" class="btn-careers-secondary">
        Why MSE
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Screenshot and visually verify**

```bash
cd ..
node screenshot.mjs http://localhost:3001/MSE/careers.html hero
```

Expected: navy gradient hero with gold eyebrow pill, large heading where "In the field." is gold, two CTAs centered. Verify CTA hover states by reviewing the CSS (no manual hover screenshot needed).

- [ ] **Step 4: Commit**

```bash
git add careers.html
git commit -m "feat(careers): add hero section"
```

---

### Task 8: Add the "Why MSE" trust strip (4 cards)

**Files:**
- Modify: `careers.html`

- [ ] **Step 1: Add CSS**

Append to inline `<style>`:

```css
/* Careers — Why MSE */
.why-mse{padding:5rem 1.5rem;background:#fff}
.why-mse-inner{max-width:1200px;margin:0 auto}
.why-mse-eyebrow{font-family:'Barlow',sans-serif;font-weight:700;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#C8102E;text-align:center;margin-bottom:.5rem}
.why-mse h2{font-family:'Barlow',sans-serif;font-weight:900;font-size:clamp(1.875rem,3vw,2.5rem);text-align:center;color:#1A2332;margin:0 0 3rem;letter-spacing:-.02em}
.why-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.25rem}
@media(max-width:900px){.why-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.why-grid{grid-template-columns:1fr}}
.why-card{background:#F5F5F5;border-radius:14px;padding:1.75rem 1.5rem;border:1px solid rgba(26,35,50,.04);transition:transform .15s cubic-bezier(.34,1.56,.64,1),box-shadow .15s}
.why-card:hover{transform:translateY(-3px);box-shadow:0 16px 36px -12px rgba(26,35,50,.18)}
.why-card-icon{width:48px;height:48px;border-radius:12px;background:rgba(200,16,46,.1);display:flex;align-items:center;justify-content:center;color:#C8102E;margin-bottom:1rem}
.why-card h3{font-family:'Barlow',sans-serif;font-weight:800;font-size:1.0625rem;color:#1A2332;margin:0 0 .5rem;letter-spacing:-.01em}
.why-card p{font-size:.9375rem;line-height:1.6;color:#555;margin:0}
```

- [ ] **Step 2: Add markup**

After the hero `</section>`, add:

```html
<section class="why-mse" id="why-mse">
  <div class="why-mse-inner">
    <div class="why-mse-eyebrow">Why MSE</div>
    <h2>A real company — with a real bench behind you.</h2>
    <div class="why-grid">
      <div class="why-card">
        <div class="why-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
        <h3>Paid training</h3>
        <p>2–4 weeks paid hourly while you ride along and learn the field. No prior HVAC license required.</p>
      </div>
      <div class="why-card">
        <div class="why-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
        <h3>Weekly pay + commission</h3>
        <p>Paychecks every week, with full reconciliation after utility reimbursement. Top performers consistently clear six figures.</p>
      </div>
      <div class="why-card">
        <div class="why-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
        <h3>Maryland-built, Maryland-only</h3>
        <p>We work BGE, Pepco, Delmarva, and SMECO territories. Not a national chain bolting on a side business.</p>
      </div>
      <div class="why-card">
        <div class="why-card-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg></div>
        <h3>Real career path</h3>
        <p>Trainee → Field Tech → Sales &amp; Service → Field Manager. Promote from within. Senior leadership roles open as we grow.</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Screenshot**

```bash
cd ..
node screenshot.mjs http://localhost:3001/MSE/careers.html why-mse
```

Expected: 4 cards on light gray backgrounds, red icon chips, navy headings, gray body copy.

- [ ] **Step 4: Commit**

```bash
git add careers.html
git commit -m "feat(careers): add Why MSE 4-card section"
```

---

### Task 8b: Add the career-path ladder

**Files:**
- Modify: `careers.html`

- [ ] **Step 1: Add CSS**

```css
/* Careers — ladder */
.ladder{padding:5rem 1.5rem;background:#1A2332;color:#fff;position:relative;overflow:hidden}
.ladder::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 70% 30%,rgba(244,161,29,.08),transparent 60%);pointer-events:none}
.ladder-inner{max-width:1200px;margin:0 auto;position:relative;z-index:1}
.ladder-eyebrow{font-family:'Barlow',sans-serif;font-weight:700;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#F4A11D;text-align:center;margin-bottom:.5rem}
.ladder h2{font-family:'Barlow',sans-serif;font-weight:900;font-size:clamp(1.875rem,3vw,2.5rem);text-align:center;color:#fff;margin:0 0 3rem;letter-spacing:-.02em}
.ladder h2 em{font-style:normal;color:#F4A11D}
.ladder-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;position:relative}
@media(max-width:900px){.ladder-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.ladder-grid{grid-template-columns:1fr}}
.ladder-step{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:1.75rem 1.25rem;text-decoration:none;color:inherit;transition:transform .15s cubic-bezier(.34,1.56,.64,1),background .15s,border-color .15s}
.ladder-step:hover{transform:translateY(-2px);background:rgba(255,255,255,.07);border-color:rgba(244,161,29,.35)}
.ladder-num{font-family:'Barlow',sans-serif;font-weight:900;font-size:.75rem;letter-spacing:.15em;color:#F4A11D;margin-bottom:.5rem}
.ladder-title{font-family:'Barlow',sans-serif;font-weight:800;font-size:1.125rem;color:#fff;margin:0 0 .75rem;line-height:1.2;letter-spacing:-.01em}
.ladder-pay{font-family:'Barlow',sans-serif;font-weight:700;font-size:.9375rem;color:rgba(255,255,255,.65)}
```

- [ ] **Step 2: Add markup**

```html
<section class="ladder">
  <div class="ladder-inner">
    <div class="ladder-eyebrow">Career path</div>
    <h2>Everyone starts the same way. <em>Where you go is up to you.</em></h2>
    <div class="ladder-grid">
      <a class="ladder-step" href="#role-trainee-overview">
        <div class="ladder-num">STAGE 01</div>
        <h3 class="ladder-title">Trainee</h3>
        <div class="ladder-pay">Hourly during 2–4 week paid training</div>
      </a>
      <a class="ladder-step" href="#role-field-service-tech">
        <div class="ladder-num">STAGE 02</div>
        <h3 class="ladder-title">Field Service Technician</h3>
        <div class="ladder-pay">$60K – $120K / yr</div>
      </a>
      <a class="ladder-step" href="#role-field-and-sales-tech">
        <div class="ladder-num">STAGE 03</div>
        <h3 class="ladder-title">Field &amp; Sales Technician</h3>
        <div class="ladder-pay">$96K – $192K / yr</div>
      </a>
      <a class="ladder-step" href="#role-field-manager">
        <div class="ladder-num">STAGE 04</div>
        <h3 class="ladder-title">Senior Manager / Field Manager</h3>
        <div class="ladder-pay">$150K – $250K+ / yr</div>
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Screenshot + commit**

```bash
cd ..
node screenshot.mjs http://localhost:3001/MSE/careers.html ladder
cd MSE
git add careers.html
git commit -m "feat(careers): add 4-stage career ladder section"
```

---

### Task 9: Add the role cards (×4) with Apply buttons and game cross-link

**Files:**
- Modify: `careers.html`

- [ ] **Step 1: Add CSS**

```css
/* Careers — role cards */
.roles{padding:5rem 1.5rem;background:#fff}
.roles-inner{max-width:1100px;margin:0 auto}
.roles-eyebrow{font-family:'Barlow',sans-serif;font-weight:700;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#C8102E;text-align:center;margin-bottom:.5rem}
.roles h2{font-family:'Barlow',sans-serif;font-weight:900;font-size:clamp(1.875rem,3vw,2.5rem);text-align:center;color:#1A2332;margin:0 0 3rem;letter-spacing:-.02em}
.role-card{background:#fff;border:1px solid rgba(26,35,50,.08);border-radius:18px;padding:2.25rem 2rem;margin-bottom:1.25rem;box-shadow:0 4px 14px -6px rgba(26,35,50,.08);transition:transform .15s cubic-bezier(.34,1.56,.64,1),box-shadow .15s,border-color .15s}
.role-card:hover{transform:translateY(-2px);box-shadow:0 18px 40px -14px rgba(26,35,50,.18);border-color:rgba(200,16,46,.18)}
.role-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:1.25rem;flex-wrap:wrap;margin-bottom:.5rem}
.role-card-titleblock h3{font-family:'Barlow',sans-serif;font-weight:900;font-size:1.625rem;color:#1A2332;margin:0;letter-spacing:-.02em}
.role-card-tag{display:inline-block;font-family:'Barlow',sans-serif;font-weight:700;font-size:.6875rem;letter-spacing:.08em;text-transform:uppercase;color:#F4A11D;margin-top:.4rem}
.role-card-pay{font-family:'Barlow',sans-serif;font-weight:800;font-size:1.125rem;color:#C8102E;white-space:nowrap}
.role-card-summary{font-size:1.0625rem;line-height:1.7;color:#444;margin:0 0 1.5rem}
.role-card-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem 2.5rem;margin-bottom:1.5rem}
@media(max-width:700px){.role-card-grid{grid-template-columns:1fr}}
.role-card-grid h4{font-family:'Barlow',sans-serif;font-weight:800;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#888;margin:0 0 .65rem}
.role-card-grid ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.45rem}
.role-card-grid li{font-size:.9375rem;line-height:1.55;color:#333;padding-left:1.25rem;position:relative}
.role-card-grid li::before{content:'';position:absolute;left:0;top:.55rem;width:6px;height:6px;border-radius:50%;background:#C8102E}
.role-card-meta{display:flex;gap:1.25rem;flex-wrap:wrap;color:#666;font-family:'Barlow',sans-serif;font-weight:600;font-size:.875rem;margin-bottom:1.5rem}
.role-card-meta span{display:inline-flex;align-items:center;gap:.4rem}
.role-card-meta svg{color:#C8102E}
.role-card-bottom{display:flex;justify-content:space-between;align-items:center;gap:1.25rem;flex-wrap:wrap;padding-top:1.25rem;border-top:1px solid rgba(26,35,50,.06)}
.role-card-game-link{font-family:'Barlow',sans-serif;font-weight:700;font-size:.875rem;color:#1A2332;text-decoration:none;display:inline-flex;align-items:center;gap:.4rem;border-bottom:2px solid transparent;transition:border-color .15s,color .15s}
.role-card-game-link:hover{color:#C8102E;border-bottom-color:#C8102E}
.btn-apply{display:inline-flex;align-items:center;gap:.5rem;background:#C8102E;color:#fff;font-family:'Barlow',sans-serif;font-weight:800;font-size:.9375rem;padding:.75rem 1.4rem;border-radius:8px;text-decoration:none;border:none;cursor:pointer;box-shadow:0 8px 20px -6px rgba(200,16,46,.45);transition:transform .12s cubic-bezier(.34,1.56,.64,1),box-shadow .12s}
.btn-apply:hover{transform:translateY(-2px);box-shadow:0 14px 30px -8px rgba(200,16,46,.55)}
.btn-apply:active{transform:translateY(0)}
```

- [ ] **Step 2: Add the four role cards**

Add this section after the ladder section:

```html
<section class="roles" id="open-roles">
  <div class="roles-inner">
    <div class="roles-eyebrow">Open roles</div>
    <h2>Pick where you want to land.</h2>

    <article class="role-card" id="role-field-service-tech">
      <div class="role-card-top">
        <div class="role-card-titleblock">
          <h3>Field Service Technician</h3>
          <div class="role-card-tag">Stage 02 · Install side</div>
        </div>
        <div class="role-card-pay">$60K – $120K / yr</div>
      </div>
      <p class="role-card-summary">The install side of the operation. Show up, clean and tune commercial rooftop HVAC units, document the work, move to the next stop. No selling required — accounts are pre-set.</p>
      <div class="role-card-grid">
        <div>
          <h4>Day-to-day</h4>
          <ul>
            <li>Service multiple units per stop</li>
            <li>Photo documentation and paperwork on a phone</li>
            <li>Real weather, real rooftops, real ladders</li>
            <li>Weekly pay; full reconciliation after utility reimbursement</li>
          </ul>
        </div>
        <div>
          <h4>Requirements</h4>
          <ul>
            <li>Maryland driver's license</li>
            <li>Personal vehicle</li>
            <li>50+ lb lift, ladder climb</li>
            <li>Coachable — no HVAC license required, we train you</li>
          </ul>
        </div>
      </div>
      <div class="role-card-meta">
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>Full-time · 1099</span>
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Maryland — BGE, Pepco, Delmarva, SMECO</span>
      </div>
      <div class="role-card-bottom">
        <a class="role-card-game-link" href="game.html" target="_blank" rel="noopener">
          See what a tune-up looks like → Play Tune-Up Tech
        </a>
        <button type="button" class="btn-apply" data-role="field-service-tech" onclick="openApplyModal('field-service-tech')">
          Apply
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </article>

    <article class="role-card" id="role-field-sales-rep">
      <div class="role-card-top">
        <div class="role-card-titleblock">
          <h3>Field Sales Representative</h3>
          <div class="role-card-tag">Sales side · Outside sales</div>
        </div>
        <div class="role-card-pay">$80K – $180K / yr</div>
      </div>
      <p class="role-card-summary">Open commercial accounts. Walk into offices, warehouses, restaurants, and hotels — explain the EmPOWER program, lock the relationship, hand the install to the tech crew. Most owners say yes because it costs them nothing.</p>
      <div class="role-card-grid">
        <div>
          <h4>Day-to-day</h4>
          <ul>
            <li>No cold calls, no scripts, no desk</li>
            <li>Door-to-door commercial outside sales</li>
            <li>Build a book of accounts that re-qualifies every 3 years</li>
            <li>Commission-based; weekly pay</li>
          </ul>
        </div>
        <div>
          <h4>Requirements</h4>
          <ul>
            <li>Maryland driver's license &amp; vehicle</li>
            <li>Field, door-to-door, or trades sales background preferred</li>
            <li>Self-driven — you set your day</li>
            <li>Bilingual a plus (Spanish especially)</li>
          </ul>
        </div>
      </div>
      <div class="role-card-meta">
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>Full-time · 1099</span>
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Statewide Maryland</span>
      </div>
      <div class="role-card-bottom">
        <span></span>
        <button type="button" class="btn-apply" data-role="field-sales-rep" onclick="openApplyModal('field-sales-rep')">
          Apply
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </article>

    <article class="role-card" id="role-field-and-sales-tech">
      <div class="role-card-top">
        <div class="role-card-titleblock">
          <h3>Field &amp; Sales Technician</h3>
          <div class="role-card-tag">Stage 03 · Top earners live here</div>
        </div>
        <div class="role-card-pay">$96K – $192K / yr</div>
      </div>
      <p class="role-card-summary">You sell <em>and</em> you service. Walk into a building, get the yes, do the tune-up on the spot, paperwork, next stop. Both install pay and sales bonus stack on the work you book yourself.</p>
      <div class="role-card-grid">
        <div>
          <h4>Day-to-day</h4>
          <ul>
            <li>Mix of self-generated and dispatched work</li>
            <li>Stage 03 in MSE's career ladder</li>
            <li>Top performers consistently clear the high end</li>
            <li>Weekly pay; full reconciliation after utility reimbursement</li>
          </ul>
        </div>
        <div>
          <h4>Requirements</h4>
          <ul>
            <li>Same baseline as Field Service Tech</li>
            <li>Willingness to talk to building owners</li>
            <li>Sales experience nice but not required — we train both sides</li>
            <li>Coachable, self-driven</li>
          </ul>
        </div>
      </div>
      <div class="role-card-meta">
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>Full-time · 1099</span>
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Statewide Maryland</span>
      </div>
      <div class="role-card-bottom">
        <a class="role-card-game-link" href="game.html" target="_blank" rel="noopener">
          See what a tune-up looks like → Play Tune-Up Tech
        </a>
        <button type="button" class="btn-apply" data-role="field-and-sales-tech" onclick="openApplyModal('field-and-sales-tech')">
          Apply
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </article>

    <article class="role-card" id="role-field-manager">
      <div class="role-card-top">
        <div class="role-card-titleblock">
          <h3>Senior Manager / Field Manager</h3>
          <div class="role-card-tag">Stage 04 · Leadership</div>
        </div>
        <div class="role-card-pay">$150K – $250K+ / yr</div>
      </div>
      <p class="role-card-summary">You own a territory. Build the crew, ride along, train new techs, audit paperwork, and grow the book. Personal earnings plus team overrides.</p>
      <div class="role-card-grid">
        <div>
          <h4>Day-to-day</h4>
          <ul>
            <li>Mix of in-field coaching and crew dispatch</li>
            <li>Senior leadership work alongside Kevin and the ops team</li>
            <li>Personal pay + team overrides</li>
            <li>Territory-based — you own a region</li>
          </ul>
        </div>
        <div>
          <h4>Requirements</h4>
          <ul>
            <li>2+ years field service, sales, or trades-management background</li>
            <li>Maryland driver's license &amp; vehicle</li>
            <li>Proven coaching / leadership</li>
            <li>Strong organization, comfortable with paperwork audits</li>
          </ul>
        </div>
      </div>
      <div class="role-card-meta">
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>Full-time · W-2</span>
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Statewide Maryland — territory-based</span>
      </div>
      <div class="role-card-bottom">
        <a class="role-card-game-link" href="game.html" target="_blank" rel="noopener">
          See what a tune-up looks like → Play Tune-Up Tech
        </a>
        <button type="button" class="btn-apply" data-role="field-manager" onclick="openApplyModal('field-manager')">
          Apply
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </article>
  </div>
</section>
```

- [ ] **Step 3: Screenshot the roles section in isolation**

```bash
cd ..
node screenshot.mjs http://localhost:3001/MSE/careers.html roles
```

Read the screenshot. Verify all four cards render, that the "Field Sales Representative" card has no game link (correct — they don't do installs), and the other three do.

- [ ] **Step 4: Commit**

```bash
git add careers.html
git commit -m "feat(careers): add 4 role cards with apply buttons and game cross-links"
```

---

### Task 10: Add the "Try the job" Tune-Up Tech section

**Files:**
- Modify: `careers.html`

- [ ] **Step 1: Add CSS**

```css
/* Careers — Try the job */
.try-job{padding:5rem 1.5rem;background:#F5F5F5}
.try-job-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center}
@media(max-width:900px){.try-job-inner{grid-template-columns:1fr;gap:2rem}}
.try-job-eyebrow{font-family:'Barlow',sans-serif;font-weight:700;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#C8102E;margin-bottom:.75rem}
.try-job-text h2{font-family:'Barlow',sans-serif;font-weight:900;font-size:clamp(1.75rem,2.75vw,2.25rem);color:#1A2332;margin:0 0 1rem;letter-spacing:-.02em;line-height:1.15}
.try-job-text h2 em{font-style:normal;color:#C8102E}
.try-job-text p{font-size:1.0625rem;line-height:1.7;color:#444;margin:0 0 1.5rem}
.try-job-card{position:relative;background:#0d1117;border-radius:16px;overflow:hidden;aspect-ratio:16/10;box-shadow:0 24px 48px -16px rgba(26,35,50,.35)}
.try-job-card img{width:100%;height:100%;object-fit:cover;opacity:.55;transition:opacity .25s}
.try-job-card:hover img{opacity:.7}
.try-job-card-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:1.5rem;background:linear-gradient(to top,rgba(13,17,23,.85) 0%,rgba(13,17,23,.45) 60%,rgba(13,17,23,.25) 100%)}
.try-job-card-title{font-family:'Barlow',sans-serif;font-weight:900;font-size:1.5rem;color:#fff;margin:0 0 .25rem;letter-spacing:-.02em}
.try-job-card-sub{font-family:'Barlow',sans-serif;font-weight:600;font-size:.875rem;color:rgba(255,255,255,.7);margin:0 0 1.25rem;letter-spacing:.05em;text-transform:uppercase}
.try-job-card-cta{display:inline-flex;align-items:center;gap:.5rem;background:#C8102E;color:#fff;font-family:'Barlow',sans-serif;font-weight:800;font-size:.9375rem;padding:.75rem 1.4rem;border-radius:8px;text-decoration:none;box-shadow:0 8px 20px -6px rgba(200,16,46,.55);transition:transform .12s cubic-bezier(.34,1.56,.64,1)}
.try-job-card-cta:hover{transform:translateY(-2px)}
```

- [ ] **Step 2: Add markup**

```html
<section class="try-job">
  <div class="try-job-inner">
    <div class="try-job-text">
      <div class="try-job-eyebrow">Try the job</div>
      <h2>Curious what the work feels like? <em>Play Tune-Up Tech.</em></h2>
      <p>Tune-Up Tech is a simulation of the actual technician workflow. Visit a building. Tune up the units. Document the job. Move to the next stop. Same loop, every day — except in the real version, the units pay you.</p>
      <p style="font-family:'Barlow',sans-serif;font-weight:600;color:#666;font-size:.9375rem;margin:0">Plays in your browser. Two minutes is enough to get the feel.</p>
    </div>
    <a class="try-job-card" href="game.html" target="_blank" rel="noopener" aria-label="Play Tune-Up Tech in a new tab">
      <img src="https://placehold.co/800x500/1A2332/F4A11D?text=Tune-Up+Tech" alt="" />
      <div class="try-job-card-overlay">
        <h3 class="try-job-card-title">Tune-Up Tech</h3>
        <div class="try-job-card-sub">A field-tech simulator</div>
        <span class="try-job-card-cta">
          Play the game
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </div>
    </a>
  </div>
</section>
```

The placeholder image will be replaced once Kevin provides a real screenshot of the game. To keep the page polished even with the placeholder, the gradient overlay treats it as a stylized card.

- [ ] **Step 3: Screenshot + commit**

```bash
cd ..
node screenshot.mjs http://localhost:3001/MSE/careers.html try-job
cd MSE
git add careers.html
git commit -m "feat(careers): add Tune-Up Tech game cross-link section"
```

---

### Task 11: Add "What you'll need" + "Real talk" sections

**Files:**
- Modify: `careers.html`

- [ ] **Step 1: Add CSS**

```css
/* Careers — requirements */
.reqs{padding:5rem 1.5rem;background:#fff}
.reqs-inner{max-width:1000px;margin:0 auto;text-align:center}
.reqs-eyebrow{font-family:'Barlow',sans-serif;font-weight:700;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#C8102E;margin-bottom:.5rem}
.reqs h2{font-family:'Barlow',sans-serif;font-weight:900;font-size:clamp(1.75rem,2.75vw,2.25rem);color:#1A2332;margin:0 0 2.5rem;letter-spacing:-.02em}
.reqs-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:1rem;margin-bottom:2.5rem}
@media(max-width:900px){.reqs-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:500px){.reqs-grid{grid-template-columns:1fr}}
.req-pill{background:#F5F5F5;border:1px solid rgba(26,35,50,.05);border-radius:14px;padding:1.5rem 1rem;display:flex;flex-direction:column;align-items:center;gap:.5rem}
.req-pill svg{color:#C8102E}
.req-pill span{font-family:'Barlow',sans-serif;font-weight:700;font-size:.9375rem;color:#1A2332;text-align:center;line-height:1.3}
.reqs-callout{background:linear-gradient(135deg,rgba(244,161,29,.08),rgba(200,16,46,.06));border:1px solid rgba(244,161,29,.25);border-radius:14px;padding:1.5rem 1.75rem;font-family:'Barlow',sans-serif;font-weight:700;font-size:1.0625rem;color:#1A2332}
.reqs-callout em{font-style:normal;color:#C8102E}

/* Careers — real talk */
.real-talk{padding:5rem 1.5rem;background:#1A2332;color:#fff}
.real-talk-inner{max-width:1000px;margin:0 auto}
.real-talk-eyebrow{font-family:'Barlow',sans-serif;font-weight:700;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#F4A11D;text-align:center;margin-bottom:.5rem}
.real-talk h2{font-family:'Barlow',sans-serif;font-weight:900;font-size:clamp(1.75rem,2.75vw,2.25rem);text-align:center;color:#fff;margin:0 0 2.5rem;letter-spacing:-.02em}
.rt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
@media(max-width:900px){.rt-grid{grid-template-columns:1fr}}
.rt-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:2rem 1.75rem}
.rt-card-num{font-family:'Barlow',sans-serif;font-weight:900;font-size:.75rem;letter-spacing:.15em;color:#F4A11D;margin-bottom:.5rem}
.rt-card h3{font-family:'Barlow',sans-serif;font-weight:800;font-size:1.125rem;color:#fff;margin:0 0 .75rem;letter-spacing:-.01em}
.rt-card p{font-size:.9375rem;line-height:1.65;color:rgba(255,255,255,.72);margin:0}
```

- [ ] **Step 2: Add markup**

```html
<section class="reqs">
  <div class="reqs-inner">
    <div class="reqs-eyebrow">What you'll need</div>
    <h2>The bar is honest, not high.</h2>
    <div class="reqs-grid">
      <div class="req-pill">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="7.5" cy="14.5" r="1.5" fill="currentColor"/><path d="M3 10h18"/></svg>
        <span>Maryland driver's license</span>
      </div>
      <div class="req-pill">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14l-1.5-9h-11z"/><circle cx="7.5" cy="17.5" r="2"/><circle cx="16.5" cy="17.5" r="2"/></svg>
        <span>Personal vehicle</span>
      </div>
      <div class="req-pill">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16M18 4v16M6 8h12M6 16h12"/></svg>
        <span>Climb ladders</span>
      </div>
      <div class="req-pill">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M4 12h16"/></svg>
        <span>50+ lb lift</span>
      </div>
      <div class="req-pill">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 12 9 18 21 6"/></svg>
        <span>Coachable, work ethic</span>
      </div>
    </div>
    <div class="reqs-callout">
      <em>No HVAC license needed.</em> We train you on everything — paperwork, the EmPOWER program, the equipment, the talk track.
    </div>
  </div>
</section>

<section class="real-talk">
  <div class="real-talk-inner">
    <div class="real-talk-eyebrow">Real talk</div>
    <h2>Three honest things, before you apply.</h2>
    <div class="rt-grid">
      <div class="rt-card">
        <div class="rt-card-num">01</div>
        <h3>It's a field job.</h3>
        <p>Rooftops. Weather. Ladders. No A/C between stops. If you want a desk, this isn't it — and that's by design.</p>
      </div>
      <div class="rt-card">
        <div class="rt-card-num">02</div>
        <h3>It's commission-driven.</h3>
        <p>Pay scales with output. Top earners show up. There's a paid training floor while you ramp — after that, the people who hustle make the most.</p>
      </div>
      <div class="rt-card">
        <div class="rt-card-num">03</div>
        <h3>It's self-driven.</h3>
        <p>You set the day. That's a gift if you have a work ethic and a problem if you don't. We hire for the first one.</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Screenshot + commit**

```bash
cd ..
node screenshot.mjs http://localhost:3001/MSE/careers.html requirements
cd MSE
git add careers.html
git commit -m "feat(careers): add requirements + real-talk sections"
```

---

### Task 12: Add the closing CTA block

**Files:**
- Modify: `careers.html`

- [ ] **Step 1: Add CSS**

```css
/* Careers — closing CTA */
.careers-cta{padding:5rem 1.5rem;background:#fff}
.careers-cta-inner{max-width:920px;margin:0 auto;background:linear-gradient(135deg,#C8102E 0%,#A30D24 100%);border-radius:18px;padding:3rem 2.5rem;text-align:center;color:#fff;position:relative;overflow:hidden;box-shadow:0 24px 48px -16px rgba(200,16,46,.45)}
.careers-cta-inner::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(255,255,255,.18),transparent 50%);pointer-events:none}
.careers-cta-inner *{position:relative;z-index:1}
.careers-cta h2{font-family:'Barlow',sans-serif;font-weight:900;font-size:clamp(1.875rem,3vw,2.5rem);color:#fff;margin:0 0 .75rem;letter-spacing:-.02em}
.careers-cta p{font-size:1.0625rem;line-height:1.6;color:rgba(255,255,255,.85);margin:0 0 2rem;max-width:540px;margin-left:auto;margin-right:auto}
.careers-cta-actions{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
.btn-careers-cta-white{display:inline-flex;align-items:center;gap:.5rem;background:#fff;color:#C8102E;font-family:'Barlow',sans-serif;font-weight:800;font-size:1rem;padding:.95rem 1.6rem;border-radius:8px;text-decoration:none;border:none;cursor:pointer;box-shadow:0 8px 20px -6px rgba(0,0,0,.25);transition:transform .12s cubic-bezier(.34,1.56,.64,1)}
.btn-careers-cta-white:hover{transform:translateY(-2px)}
.btn-careers-cta-ghost{display:inline-flex;align-items:center;gap:.5rem;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.35);color:#fff;font-family:'Barlow',sans-serif;font-weight:700;font-size:1rem;padding:.95rem 1.6rem;border-radius:8px;text-decoration:none;transition:background .15s}
.btn-careers-cta-ghost:hover{background:rgba(255,255,255,.18)}
```

- [ ] **Step 2: Add markup**

```html
<section class="careers-cta">
  <div class="careers-cta-inner">
    <h2>Ready to apply?</h2>
    <p>Fill out the application — we review every one personally and reach out within one business day to book your 1-on-1.</p>
    <div class="careers-cta-actions">
      <button type="button" class="btn-careers-cta-white" onclick="openApplyModal('field-and-sales-tech')">
        Apply now
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <a href="tel:3018887090" class="btn-careers-cta-ghost">
        Or call (301) 888-7090
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Screenshot + commit**

```bash
cd ..
node screenshot.mjs http://localhost:3001/MSE/careers.html cta
cd MSE
git add careers.html
git commit -m "feat(careers): add closing CTA block"
```

---

### Task 13: Build the application modal + JS wiring

**Files:**
- Modify: `careers.html`

- [ ] **Step 1: Add modal CSS**

Append to inline `<style>`:

```css
/* Careers — application modal */
.modal-overlay{position:fixed;inset:0;background:rgba(13,17,23,.7);display:none;align-items:flex-start;justify-content:center;padding:2rem 1rem;z-index:1000;overflow-y:auto}
.modal-overlay.is-open{display:flex}
.modal{background:#fff;border-radius:16px;max-width:560px;width:100%;padding:2.5rem 2rem 2rem;position:relative;box-shadow:0 32px 64px -16px rgba(0,0,0,.45);animation:modal-in .18s cubic-bezier(.34,1.56,.64,1)}
@keyframes modal-in{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
.modal-close{position:absolute;top:1rem;right:1rem;width:36px;height:36px;border-radius:8px;background:#F5F5F5;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#1A2332;transition:background .15s}
.modal-close:hover{background:#e5e5e5}
.modal h2{font-family:'Barlow',sans-serif;font-weight:900;font-size:1.5rem;color:#1A2332;margin:0 0 .35rem;letter-spacing:-.02em}
.modal-sub{font-size:.9375rem;color:#666;margin:0 0 1.5rem}
.modal-form{display:flex;flex-direction:column;gap:1rem}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
@media(max-width:480px){.field-row{grid-template-columns:1fr}}
.field label{display:block;font-family:'Barlow',sans-serif;font-weight:700;font-size:.8125rem;color:#1A2332;margin-bottom:.35rem}
.field input,.field select,.field textarea{width:100%;padding:.65rem .8rem;border:1px solid rgba(26,35,50,.18);border-radius:8px;font-family:'Source Sans 3',sans-serif;font-size:.9375rem;color:#1A2332;background:#fff;transition:border-color .15s,box-shadow .15s}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:#C8102E;box-shadow:0 0 0 3px rgba(200,16,46,.12)}
.field textarea{min-height:90px;resize:vertical}
.field input[type="file"]{padding:.5rem;background:#F5F5F5}
.field-error{color:#C8102E;font-family:'Barlow',sans-serif;font-weight:600;font-size:.8125rem;margin-top:.3rem;display:none}
.field.has-error input,.field.has-error select,.field.has-error textarea{border-color:#C8102E}
.field.has-error .field-error{display:block}
.yesno-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem}
@media(max-width:480px){.yesno-row{grid-template-columns:1fr}}
.modal-submit{margin-top:.5rem;background:#C8102E;color:#fff;font-family:'Barlow',sans-serif;font-weight:800;font-size:1rem;padding:.95rem 1.4rem;border-radius:8px;border:none;cursor:pointer;transition:transform .12s cubic-bezier(.34,1.56,.64,1),background .12s}
.modal-submit:hover{background:#A30D24;transform:translateY(-1px)}
.modal-submit:disabled{opacity:.6;cursor:not-allowed;transform:none}
.modal-banner{padding:.75rem 1rem;border-radius:8px;font-family:'Barlow',sans-serif;font-weight:600;font-size:.9rem;display:none}
.modal-banner.error{display:block;background:rgba(200,16,46,.08);color:#C8102E;border:1px solid rgba(200,16,46,.2)}
.modal-success{display:none;text-align:center;padding:1rem 0}
.modal-success.is-open{display:block}
.modal-success-icon{width:64px;height:64px;border-radius:50%;background:rgba(34,197,94,.12);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;color:#16a34a}
.modal-success h3{font-family:'Barlow',sans-serif;font-weight:900;font-size:1.25rem;color:#1A2332;margin:0 0 .5rem}
.modal-success p{color:#555;font-size:.9375rem;line-height:1.6;margin:0 0 1.25rem}
```

- [ ] **Step 2: Add modal markup at the bottom of `<main>`**

```html
<div class="modal-overlay" id="apply-modal" role="dialog" aria-labelledby="apply-modal-title" aria-hidden="true">
  <div class="modal">
    <button type="button" class="modal-close" onclick="closeApplyModal()" aria-label="Close">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
    </button>

    <div id="apply-form-wrap">
      <h2 id="apply-modal-title">Apply</h2>
      <p class="modal-sub">We review every application personally. We'll reach out within 1 business day.</p>

      <div class="modal-banner" id="apply-banner"></div>

      <form class="modal-form" id="apply-form" enctype="multipart/form-data" novalidate>
        <div class="field">
          <label for="role">Role applying for</label>
          <select id="role" name="role" required>
            <option value="field-service-tech">Field Service Technician</option>
            <option value="field-sales-rep">Field Sales Representative</option>
            <option value="field-and-sales-tech">Field &amp; Sales Technician</option>
            <option value="field-manager">Senior Manager / Field Manager</option>
          </select>
          <div class="field-error" data-error-for="role"></div>
        </div>

        <div class="field-row">
          <div class="field"><label for="firstName">First name</label><input id="firstName" name="firstName" type="text" required /><div class="field-error" data-error-for="firstName"></div></div>
          <div class="field"><label for="lastName">Last name</label><input id="lastName" name="lastName" type="text" required /><div class="field-error" data-error-for="lastName"></div></div>
        </div>

        <div class="field-row">
          <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" required /><div class="field-error" data-error-for="email"></div></div>
          <div class="field"><label for="phone">Phone</label><input id="phone" name="phone" type="tel" required /><div class="field-error" data-error-for="phone"></div></div>
        </div>

        <div class="field-row">
          <div class="field"><label for="zip">ZIP code</label><input id="zip" name="zip" type="text" inputmode="numeric" maxlength="5" required /><div class="field-error" data-error-for="zip"></div></div>
          <div class="field"><label for="yearsExperience">Years of experience</label><input id="yearsExperience" name="yearsExperience" type="number" min="0" max="50" required /><div class="field-error" data-error-for="yearsExperience"></div></div>
        </div>

        <div class="field">
          <label for="tellUsAboutYou">Tell us about yourself (500 chars)</label>
          <textarea id="tellUsAboutYou" name="tellUsAboutYou" maxlength="500" required></textarea>
          <div class="field-error" data-error-for="tellUsAboutYou"></div>
        </div>

        <div class="field">
          <label for="resume">Resume (PDF or Word, 10MB max)</label>
          <input id="resume" name="resume" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required />
          <div class="field-error" data-error-for="resume"></div>
        </div>

        <div class="field">
          <label>Maryland driver's license?</label>
          <div class="yesno-row">
            <label><input type="radio" name="hasMdLicense" value="yes" required /> Yes</label>
            <label><input type="radio" name="hasMdLicense" value="no" /> No</label>
            <span></span>
          </div>
          <div class="field-error" data-error-for="hasMdLicense"></div>
        </div>

        <div class="field">
          <label>Personal vehicle?</label>
          <div class="yesno-row">
            <label><input type="radio" name="hasVehicle" value="yes" required /> Yes</label>
            <label><input type="radio" name="hasVehicle" value="no" /> No</label>
            <span></span>
          </div>
          <div class="field-error" data-error-for="hasVehicle"></div>
        </div>

        <div class="field">
          <label>Comfortable on rooftops/ladders &amp; 50+ lb lift?</label>
          <div class="yesno-row">
            <label><input type="radio" name="comfortableFieldWork" value="yes" required /> Yes</label>
            <label><input type="radio" name="comfortableFieldWork" value="no" /> No</label>
            <span></span>
          </div>
          <div class="field-error" data-error-for="comfortableFieldWork"></div>
        </div>

        <div class="field">
          <label for="referralSource">How did you hear about us? (optional)</label>
          <select id="referralSource" name="referralSource">
            <option value="">Pick one</option>
            <option>Indeed</option>
            <option>LinkedIn</option>
            <option>Facebook</option>
            <option>Friend / Referral</option>
            <option>Other</option>
          </select>
        </div>

        <button type="submit" class="modal-submit" id="apply-submit">Submit application</button>
      </form>
    </div>

    <div class="modal-success" id="apply-success">
      <div class="modal-success-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 13 10 18 20 7"/></svg>
      </div>
      <h3>Thanks — we got your application.</h3>
      <p>We review every one personally. Expect a text or call within 1 business day to book your 1-on-1.</p>
      <button type="button" class="modal-submit" onclick="closeApplyModal()">Close</button>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Add the JS wiring at the bottom of the file (just before `</body>`)**

```html
<script>
  const ROLE_DISPLAY = {
    'field-service-tech':   'Field Service Technician',
    'field-sales-rep':      'Field Sales Representative',
    'field-and-sales-tech': 'Field & Sales Technician',
    'field-manager':        'Senior Manager / Field Manager'
  };

  function openApplyModal(role) {
    const overlay = document.getElementById('apply-modal');
    const select = document.getElementById('role');
    if (role && ROLE_DISPLAY[role]) select.value = role;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('apply-form-wrap').style.display = '';
    document.getElementById('apply-success').classList.remove('is-open');
  }

  function closeApplyModal() {
    const overlay = document.getElementById('apply-modal');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    clearFormErrors();
  }

  document.getElementById('apply-modal').addEventListener('click', (e) => {
    if (e.target.id === 'apply-modal') closeApplyModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('apply-modal').classList.contains('is-open')) closeApplyModal();
  });

  function clearFormErrors() {
    document.querySelectorAll('.field.has-error').forEach(el => el.classList.remove('has-error'));
    document.querySelectorAll('[data-error-for]').forEach(el => el.textContent = '');
    const banner = document.getElementById('apply-banner');
    banner.classList.remove('error');
    banner.textContent = '';
  }

  function setFieldError(name, msg) {
    const errorEl = document.querySelector(`[data-error-for="${name}"]`);
    if (!errorEl) return;
    errorEl.textContent = msg;
    const parent = errorEl.closest('.field');
    if (parent) parent.classList.add('has-error');
  }

  document.getElementById('apply-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors();

    const submitBtn = document.getElementById('apply-submit');
    const banner = document.getElementById('apply-banner');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    const formData = new FormData(e.target);

    try {
      const res = await fetch('/api/career-application', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        document.getElementById('apply-form-wrap').style.display = 'none';
        document.getElementById('apply-success').classList.add('is-open');
      } else if (data.fieldErrors) {
        for (const [name, msg] of Object.entries(data.fieldErrors)) setFieldError(name, msg);
        banner.classList.add('error');
        banner.textContent = data.error || 'Please fix the highlighted fields.';
      } else {
        banner.classList.add('error');
        banner.textContent = data.error || 'Something broke on our end. Please try again, or email careers@mdsmartenergy.com directly.';
      }
    } catch (err) {
      banner.classList.add('error');
      banner.textContent = 'Network error. Please try again, or email careers@mdsmartenergy.com directly.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit application';
    }
  });
</script>
```

- [ ] **Step 4: Smoke-test the modal end-to-end (manual)**

With `vercel dev` running and Drive/email/HighLevel provisioned:

1. Open `http://localhost:3000/careers.html`.
2. Click any "Apply" button — modal opens with the right role pre-selected.
3. Submit empty form — every field shows a red error.
4. Submit invalid email — email field shows error.
5. Submit valid form with a real PDF — success screen appears.
6. Verify resume in Drive subfolder, contact in HighLevel pipeline, email at `careers@`.
7. Press Escape — modal closes.
8. Click outside the modal box — modal closes.

If any of HighLevel/Drive/email isn't provisioned: the request should still succeed because email/HighLevel failures are caught and logged. But Drive failure halts the request — if Drive isn't ready, document the blocker.

- [ ] **Step 5: Commit**

```bash
git add careers.html
git commit -m "feat(careers): add application modal with form validation and success state"
```

---

## Phase 3 — Site integration

### Task 14: Add Careers nav link across all pages

**Files (modify):**
- `index.html`
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
- `404.html`
- `terms.html`
- `privacy.html`

- [ ] **Step 1: For each page in the list above, locate the desktop nav `<ul class="nav-links">` block**

In each page, find the `<li>` for FAQ and the `<li>` for Contact in the desktop nav. Insert a new `<li>` between them.

For top-level pages (anything in `MSE/` directly):

```html
<li><a href="careers.html">Careers</a></li>
```

For pages in `services/` (which use relative paths back to root):

```html
<li><a href="../careers.html">Careers</a></li>
```

- [ ] **Step 2: For each page, find the mobile nav `<div class="mobile-nav">`**

Insert between the FAQ entry and the Contact entry:

For top-level pages:

```html
<a href="careers.html">Careers</a>
```

For services pages:

```html
<a href="../careers.html">Careers</a>
```

- [ ] **Step 3: For each page, locate the footer Resources column `<ul>`**

Insert a new `<li>` after the FAQ entry inside the Resources column.

For top-level pages:

```html
<li><a href="careers.html">Careers</a></li>
```

For services pages:

```html
<li><a href="../careers.html">Careers</a></li>
```

- [ ] **Step 4: Sanity-check pages that may not share the chrome**

Open `404.html`, `terms.html`, `privacy.html` and confirm they have the same `<ul class="nav-links">` and `<div class="mobile-nav">` and footer pattern. If any of those pages uses a different (older) chrome, skip the nav update for THAT specific file and note it in the commit message. Do not rebuild the chrome.

- [ ] **Step 5: Visual smoke-test — screenshot 4 representative pages**

```bash
cd ..
node screenshot.mjs http://localhost:3001/MSE/index.html nav-index
node screenshot.mjs http://localhost:3001/MSE/about.html nav-about
node screenshot.mjs http://localhost:3001/MSE/services/hvac-tune-up.html nav-services
node screenshot.mjs http://localhost:3001/MSE/empower-maryland.html nav-empower
```

Read each screenshot. Verify that "Careers" appears between FAQ and Contact in the nav on every one.

- [ ] **Step 6: Commit**

```bash
git add index.html about.html contact.html faq.html blog.html pricing.html empower-maryland.html bge-energy-efficiency.html pepco-energy-efficiency.html delmarva-energy-efficiency.html smeco-energy-efficiency.html services/ 404.html terms.html privacy.html
git commit -m "feat(careers): add Careers nav link to header, mobile nav, and footer across all pages"
```

---

### Task 15: Add the homepage teaser section

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Identify insertion point**

Open `index.html` and find the section break between "Our Services" and the customer CTA block (the existing "Ready to Reduce Your Energy Costs?" CTA). The teaser goes between them.

- [ ] **Step 2: Add CSS to the inline `<style>` block in `index.html`**

```css
/* Homepage — careers teaser */
.careers-teaser{padding:4rem 1.5rem;background:#F5F5F5;border-top:1px solid rgba(26,35,50,.05);border-bottom:1px solid rgba(26,35,50,.05)}
.careers-teaser-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr auto;gap:2rem;align-items:center}
@media(max-width:760px){.careers-teaser-inner{grid-template-columns:1fr;text-align:center}}
.careers-teaser-text h2{font-family:'Barlow',sans-serif;font-weight:900;font-size:clamp(1.5rem,2.4vw,2rem);color:#1A2332;margin:0 0 .5rem;letter-spacing:-.02em}
.careers-teaser-text h2 em{font-style:normal;color:#C8102E}
.careers-teaser-text p{font-size:1rem;line-height:1.6;color:#555;margin:0;max-width:560px}
.careers-teaser-cta{display:inline-flex;align-items:center;gap:.5rem;background:#1A2332;color:#fff;font-family:'Barlow',sans-serif;font-weight:800;font-size:.9375rem;padding:.85rem 1.5rem;border-radius:8px;text-decoration:none;box-shadow:0 8px 18px -6px rgba(26,35,50,.4);transition:transform .12s cubic-bezier(.34,1.56,.64,1),background .12s}
.careers-teaser-cta:hover{background:#C8102E;transform:translateY(-2px)}
```

- [ ] **Step 3: Insert the teaser markup**

Between "Our Services" and the customer CTA block:

```html
<section class="careers-teaser">
  <div class="careers-teaser-inner">
    <div class="careers-teaser-text">
      <h2>We're hiring across <em>Maryland.</em></h2>
      <p>Field tech, field sales, cross-trained sales+service, and senior management roles. Paid training. Weekly pay. A real career path — not a gig.</p>
    </div>
    <a class="careers-teaser-cta" href="careers.html">
      View open roles
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
  </div>
</section>
```

- [ ] **Step 4: Screenshot the homepage to verify placement**

```bash
cd ..
node screenshot.mjs http://localhost:3001/MSE/index.html homepage-with-teaser
```

Verify the teaser sits between Services and the customer CTA block. Light gray background. Doesn't compete visually with the primary $0 HVAC tune-up CTAs.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(careers): add homepage teaser section linking to /careers.html"
```

---

### Task 16: Update sitemap

**Files:**
- Modify: `sitemap.xml`

- [ ] **Step 1: Add the careers URL**

Open `sitemap.xml`. Insert a new `<url>` entry alongside the existing pages:

```xml
<url>
  <loc>https://www.mdsmartenergy.com/careers.html</loc>
  <lastmod>2026-05-01</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

Match the indentation and tag style of the existing entries.

- [ ] **Step 2: Verify XML is well-formed**

```bash
node -e "require('fs').readFileSync('sitemap.xml','utf8'); console.log('ok')"
```

(`fs.readFileSync` doesn't validate XML, but a quick visual scan after opening the file will catch any malformed insert. If you have `xmllint` available, use that instead.)

- [ ] **Step 3: Commit**

```bash
git add sitemap.xml
git commit -m "feat(careers): add careers.html to sitemap"
```

---

## Phase 4 — Verification

### Task 17: Desktop screenshot review

**Files:** None modified.

- [ ] **Step 1: Capture full-page desktop screenshots**

```bash
cd ..
node screenshot.mjs http://localhost:3001/MSE/careers.html desktop-full
node screenshot.mjs http://localhost:3001/MSE/index.html desktop-home-with-teaser
```

- [ ] **Step 2: Read each screenshot and check against the brand guide**

For `desktop-full`, verify:
- Hero matches navy gradient + gold eyebrow + red+ghost CTAs.
- "Why MSE" 4-card strip uses light gray cards, red icons, navy headings.
- Career-path ladder uses navy background with gold step numbers.
- 4 role cards render with red Apply buttons. Field Sales Rep card has NO game link. Other 3 do.
- Try-the-Job section has navy/red gradient game card.
- Requirements pills: 5 across (or wraps on narrow widths), red-tinted check icons.
- Real-talk section: navy with 3 cards.
- Closing CTA: red gradient block.
- Footer Careers link present in Resources column.
- No per-unit dollar amounts anywhere on the page (Cmd+F-equivalent: scan visually for `$10`, `$50`, `$80`, `$175`, `$3,000`, `$1,050`, `$500` — none should appear).

For `desktop-home-with-teaser`, verify:
- Teaser section sits between Services and customer CTA.
- Light gray background, navy CTA button.

- [ ] **Step 3: If issues found, fix inline and re-screenshot**

Iterate at least once. The CLAUDE.md project rule says do at least 2 comparison rounds.

---

### Task 18: Mobile screenshot review

**Files:** None modified.

- [ ] **Step 1: Capture mobile screenshots**

The existing `screenshot.mjs` may take desktop-only screenshots; check its viewport setting. If it doesn't have a mobile flag, use the existing `MSE/mobile-test.mjs` or `mobile-nav-shot.mjs` patterns to take 768px-wide captures of:
- `careers.html` full page
- `careers.html` with the modal open (run JS to call `openApplyModal('field-and-sales-tech')` after page load)
- `index.html` showing the teaser

- [ ] **Step 2: Verify on mobile**
- Hero CTAs stack and are tappable.
- Why-MSE grid collapses to 2 cols then 1 col.
- Role cards: pay range still visible (does not overlap title); requirements grid collapses to single column.
- Modal is scrollable and all fields are reachable.
- Mobile nav menu opens, "Careers" appears between FAQ and Contact.

- [ ] **Step 3: Fix any mobile-specific issues and re-screenshot.**

---

### Task 19: End-to-end smoke test (with `vercel dev` and full env)

**Files:** None modified.

This task runs only after Kevin has provisioned all open items from the spec (HighLevel pipeline + custom fields, Drive folder, careers@ mailbox, Resend key). If any are missing, document blockers and skip to the partial smoke test below.

- [ ] **Step 1: Submit a full happy-path application**

With `vercel dev` running, open `http://localhost:3000/careers.html`. Click "Apply" on the Field & Sales Technician card. Fill the form with realistic test data. Attach a small PDF resume.

Submit. Verify:
1. Success screen renders.
2. Drive: file lands at `Careers Applications/field-and-sales-tech/{timestamp}-Test_User-field-and-sales-tech.pdf`.
3. HighLevel: contact appears in the Careers pipeline at the New Application stage with all custom fields populated and tags `["Career Application", "Field & Sales Technician"]`.
4. Email: alert lands at `careers@mdsmartenergy.com` with subject `New career application — Field & Sales Technician — Test User` and a working Drive link.

- [ ] **Step 2: Submit invalid applications**

Try:
- Empty form → expect inline errors on every required field.
- Email = "not-an-email" → expect email field error.
- ZIP = "abc" → expect ZIP error.
- Resume = a `.txt` file → expect "Resume must be a PDF or Word document."
- Resume > 10 MB → expect "Resume is too large".

- [ ] **Step 3: Partial-environment smoke test (if blockers exist)**

If only Drive is provisioned: submit happy-path, expect 200, check Drive lands the file, observe console logs showing HighLevel + email errors gracefully caught.

If Drive is missing: submit happy-path, expect 500 with "Resume upload failed."

Document the partial state in a note for Kevin.

---

### Task 20: Final review + clean up

- [ ] **Step 1: Re-run unit tests**

```bash
node --test tests/career-validation.test.js
```

Expected: all 8 pass.

- [ ] **Step 2: Confirm no temp/smoke files committed**

```bash
git status
```

Should be clean. If `_smoke-drive.js` or any other temp file is tracked, remove it.

- [ ] **Step 3: Verify the per-unit-pay constraint one more time**

```bash
grep -n -E '\$10|\$50|\$75|\$100|\$175|\$80/' careers.html index.html
```

Expected: no matches (or only matches for the existing `$0` HVAC tune-up customer-side messaging in `index.html`, which is unrelated). Per-unit pay numbers must not appear on the careers page or homepage teaser.

- [ ] **Step 4: Final commit if any cleanup happened**

```bash
git status
# if anything to commit:
git commit -m "chore(careers): final cleanup"
```

- [ ] **Step 5: Surface follow-up items to Kevin**

Compile a short message listing any open spec items still outstanding (per the spec's "Open items for Kevin" list) so deployment isn't blocked silently:

- careers@mdsmartenergy.com mailbox
- HighLevel Careers pipeline + stage UUIDs
- HighLevel custom field keys
- CAREERS_DRIVE_FOLDER_ID
- RESEND_API_KEY (and optionally RESEND_FROM_EMAIL)
- Recruiting deck public URL (if any) for the hero "Watch the 20-min overview" CTA — currently the secondary CTA links to the `#why-mse` anchor as the agreed fallback.

---

## Self-review (writer)

Spec coverage:
- Hero, Why MSE, Ladder, Roles, Try-the-Job, Requirements, Real-Talk, CTA, Footer — Tasks 7–12.
- Modal + JS — Task 13.
- Nav + footer Careers link across all pages — Task 14.
- Homepage teaser — Task 15.
- Sitemap entry — Task 16.
- Backend endpoint, Drive helper, email helper, validation helper — Tasks 1–5.
- Per-unit pay prohibition — enforced in role copy and re-checked in Task 20 Step 3.
- Tune-Up Tech cross-link in 3 of 4 role cards (not Field Sales Rep) — Task 9.
- Acceptance criteria — covered by Tasks 17–19.

Placeholder scan: No "TBD" / "TODO" / "implement later" in steps. The recruiting-deck URL is explicitly handled with a documented fallback in Task 20 Step 5 and the spec.

Type/name consistency:
- `validateApplication`, `getRoleDisplayName`, `ROLES` are defined in Task 2 and used identically in Task 5.
- `uploadResume({ buffer, fileName, mimeType, role, applicantName })` defined in Task 3, called with the same signature in Task 5.
- `sendApplicationAlert(payload)` defined in Task 4, called with the same payload shape in Task 5.
- Role slugs: `field-service-tech`, `field-sales-rep`, `field-and-sales-tech`, `field-manager` — used identically in validation, role cards, modal `<select>`, and `ROLE_DISPLAY` JS map.
- Custom field keys (`role_applying_for`, etc.) match between Task 5 and the spec's HighLevel section.
