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
