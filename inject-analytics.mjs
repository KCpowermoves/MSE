// Maryland Smart Energy — GA4 analytics injector
// Idempotently injects a Google Analytics 4 (gtag.js) block + custom event
// tracking into every public HTML page on mdsmartenergy.com.
//
// Usage:
//   node inject-analytics.mjs              -> uses MEASUREMENT_ID below
//   node inject-analytics.mjs G-ABC123XYZ  -> overrides with a real GA4 ID
//
// Re-running is safe. The block lives between <!-- GA4:BEGIN --> and
// <!-- GA4:END -->; re-running removes the old block and inserts a fresh
// one, so swapping in the real Measurement ID is a one-command operation.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuration ──────────────────────────────────────────────────────────
// Replace with the real GA4 Measurement ID, or pass it as the first CLI arg.
const MEASUREMENT_ID = process.argv[2] || 'G-XXXXXXXXXX';

// Folders we never touch (internal tools, deps, asset embeds, screenshots).
const EXCLUDE_DIRS = new Set([
  'node_modules', 'admin', 'brand_assets', 'temporary screenshots', '.git',
]);

const BEGIN = '<!-- GA4:BEGIN (auto-injected by inject-analytics.mjs — do not edit by hand) -->';
const END = '<!-- GA4:END -->';

// ── The injected block ─────────────────────────────────────────────────────
function buildBlock(id) {
  return `${BEGIN}
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${id}');
</script>
<script>
/* Maryland Smart Energy — custom conversion events. No dependencies. */
(function () {
  function ev(name, params) {
    try { gtag('event', name, params || {}); } catch (e) {}
  }
  function ctx(el) {
    return {
      link_text: (el && (el.innerText || el.textContent) || '').trim().slice(0, 100),
      link_url: (el && el.getAttribute && el.getAttribute('href')) || '',
      page_location: location.href,
      page_path: location.pathname
    };
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = (a.getAttribute('href') || '').trim();
    var text = ((a.innerText || a.textContent) || '').trim();

    // Phone clicks — high-value lead signal
    if (/^tel:/i.test(href)) { ev('phone_click', ctx(a)); return; }

    // Email clicks
    if (/^mailto:/i.test(href)) { ev('email_click', ctx(a)); return; }

    // Primary CTA: anything routing to the scheduling / $0 deposit pages,
    // or whose label is the "Schedule your $0 tune-up" call to action.
    if (/(^|\\/)pricing\\.html/i.test(href) ||
        /0deposit/i.test(href) ||
        /schedule[^a-z]*your[^a-z]*\\$?0?[^a-z]*hvac|schedule[^a-z]*(your[^a-z]*)?(free[^a-z]*)?tune[- ]?up/i.test(text)) {
      ev('cta_schedule_click', ctx(a));
    }
  }, true);

  // Best-effort Paperform submission -> GA4 'generate_lead'.
  // The authoritative submission conversion should also be configured via
  // Paperform's native Google Analytics integration (see ANALYTICS-SETUP.md).
  window.addEventListener('message', function (e) {
    try {
      if (!/paperform/i.test(String(e.origin || ''))) return;
      var d = e.data || {};
      var t = String((typeof d === 'object' && (d.type || d.event)) || d || '');
      if (/submit|submission|complete|thank/i.test(t)) {
        ev('generate_lead', { method: 'paperform', page_path: location.pathname });
      }
    } catch (err) {}
  });
})();
</script>
${END}`;
}

// ── Injection ──────────────────────────────────────────────────────────────
function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

const blockRe = new RegExp(
  '\\n?' + escapeRe(BEGIN) + '[\\s\\S]*?' + escapeRe(END) + '\\n?',
  'g'
);
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const files = walk(__dirname, []);
let injected = 0, skipped = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const headMatch = html.match(/<head[^>]*>/i);
  if (!headMatch || !/<\/head>/i.test(html)) { skipped++; continue; }

  // Strip any previous auto-injected block (idempotent re-runs / ID swap).
  html = html.replace(blockRe, '\n');

  // Insert the fresh block immediately after the opening <head> tag.
  const insertAt = headMatch.index + headMatch[0].length;
  html = html.slice(0, insertAt) + '\n' + buildBlock(MEASUREMENT_ID) + html.slice(insertAt);

  fs.writeFileSync(file, html, 'utf8');
  injected++;
  console.log('  + ' + path.relative(__dirname, file).replace(/\\/g, '/'));
}

console.log(
  `\nGA4 (${MEASUREMENT_ID}) injected into ${injected} file(s), ${skipped} skipped (no <head>).`
);
if (MEASUREMENT_ID === 'G-XXXXXXXXXX') {
  console.log('NOTE: still using the placeholder ID. Re-run with the real ID:');
  console.log('      node inject-analytics.mjs G-YOURREALID');
}
