/* POST /api/register-affiliate
 *
 * Captures a blog reader's name + email + (optional) company when they want
 * a personalized share link with a referral reward attached. The slug they
 * generate is what rides through ?an= on every link they share.
 *
 * Writes the record to AFFILIATE_SIGNUP_SHEET (a Google Sheet) and, when
 * GHL_API_TOKEN is set, also creates a HighLevel contact tagged
 * "Blog Affiliate" so Kevin can email them when their share converts.
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 *   AFFILIATE_SIGNUP_SHEET    — spreadsheetId of the affiliate signup sheet
 * Optional env vars:
 *   GHL_API_TOKEN             — when set, also creates a HighLevel contact
 *   GHL_LOCATION_ID
 */

const { appendAffiliateSignup } = require('./lib/google-sheets');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data && data.meta && data.meta.contactId) return { contact: { id: data.meta.contactId } };
    throw new Error(JSON.stringify(data));
  }
  return data;
}

function sanitizeText(s, max) {
  return String(s || '')
    .replace(/[<>"'`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max || 200);
}

function sanitizeSlug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 80);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end('Method Not Allowed');
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  // Honeypot — silently succeed without recording so bots think it worked.
  if (body.website && String(body.website).trim() !== '') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true }));
  }

  const name = sanitizeText(body.name, 60);
  const company = sanitizeText(body.company, 80);
  const email = sanitizeText(body.email, 120).toLowerCase();
  const slug = sanitizeSlug(body.slug);
  const postUrl = sanitizeText(body.postUrl, 500);
  const postTitle = sanitizeText(body.postTitle, 200);

  if (!name || name.length < 2) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: 'name_required' }));
  }
  if (!email || !EMAIL_RE.test(email)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: 'email_invalid' }));
  }
  if (!slug) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: 'slug_invalid' }));
  }

  const payload = { name, email, company, slug, postUrl, postTitle };

  // Best-effort: write to Sheet AND (if configured) HighLevel. Either failing
  // shouldn't block the user from getting their share link, so we always
  // return success unless we got a 4xx-worthy validation problem above.
  const results = { sheet: null, ghl: null };

  try {
    results.sheet = await appendAffiliateSignup(payload);
  } catch (err) {
    console.error('appendAffiliateSignup failed:', err && err.message);
    results.sheet = { error: err && err.message };
  }

  if (process.env.GHL_API_TOKEN && process.env.GHL_LOCATION_ID) {
    try {
      const parts = name.split(/\s+/);
      const firstName = parts[0] || name;
      const lastName = parts.slice(1).join(' ') || '';
      const ghlRes = await ghl('/contacts/', {
        locationId: process.env.GHL_LOCATION_ID,
        firstName,
        lastName,
        email,
        companyName: company || undefined,
        source: 'Blog Affiliate Signup',
        tags: ['Blog Affiliate', 'Affiliate Signup'],
        customFields: [
          { key: 'affiliate_slug', field_value: slug },
          { key: 'affiliate_post_url', field_value: postUrl },
          { key: 'affiliate_post_title', field_value: postTitle }
        ]
      }, process.env.GHL_API_TOKEN);
      results.ghl = { contactId: ghlRes && ghlRes.contact && ghlRes.contact.id };
    } catch (err) {
      console.error('GHL affiliate contact create failed:', err && err.message);
      results.ghl = { error: err && err.message };
    }
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ ok: true, slug }));
};
