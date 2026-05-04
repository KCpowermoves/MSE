/* One-shot installer: adds the share-tracking <link> and <script> tags to every
 * site HTML page. Idempotent — re-run safely; files that already include the
 * tags are skipped.
 *
 * Run from the MSE/ directory:   node apply-share-tracking.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SKIP_DIRS = new Set([
  'node_modules',
  'current site',
  'docs',
  'admin',
  'game',
  'temporary screenshots',
  'tests',
  'brand_assets',
  'case-study-photos',
  'Pricing Widget',
  'New folder',
]);

const TAGS = `
  <!-- share-tracking: customer/agent referral attribution (?an=) -->
  <link rel="stylesheet" href="/share-tracking.css" />
  <script src="/share-tracking.js" defer></script>`;

const MARKER = 'share-tracking.js';

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, out);
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.html')) {
      out.push(full);
    }
  }
}

const files = [];
walk(__dirname, files);

let added = 0, skipped = 0, missingHead = 0;

for (const file of files) {
  const rel = path.relative(__dirname, file);
  let html = fs.readFileSync(file, 'utf8');

  if (html.includes(MARKER)) {
    skipped++;
    console.log(`  skip   ${rel}  (already has share-tracking)`);
    continue;
  }

  const headCloseIdx = html.search(/<\/head\s*>/i);
  if (headCloseIdx < 0) {
    missingHead++;
    console.log(`  no </head>  ${rel}  (skipped)`);
    continue;
  }

  const before = html.slice(0, headCloseIdx);
  const after = html.slice(headCloseIdx);
  const updated = before + TAGS + '\n' + after;
  fs.writeFileSync(file, updated, 'utf8');
  added++;
  console.log(`  add    ${rel}`);
}

console.log('');
console.log(`Done. Added to ${added} file(s); skipped ${skipped} already-instrumented; ${missingHead} had no </head>.`);
