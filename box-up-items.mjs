import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
const B = 'C:/Users/kevin/Claudecode/MSE';
const read = f => readFileSync(join(B, f), 'utf8');
const write = (f, c) => { writeFileSync(join(B, f), c, 'utf8'); console.log('✓', f); };

const ITEM_BOX = `background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.25);border-radius:10px;padding:.875rem 1rem;backdrop-filter:blur(6px)`;

// ── HVAC tune-up ─────────────────────────────────────────────
let hvac = read('services/hvac-tune-up.html');
// info-item: add box styling
hvac = hvac.replace(
  `    .info-item { display: flex; align-items: flex-start; gap: 0.75rem; }`,
  `    .info-item { display: flex; align-items: center; gap: 0.875rem; ${ITEM_BOX}; }`
);
// subtitle text: less faint
hvac = hvac.replace(
  `    .info-text span { font-size: 0.8125rem; color: rgba(255,255,255,0.55); }`,
  `    .info-text span { font-size: 0.8125rem; color: rgba(255,255,255,0.8); }`
);
write('services/hvac-tune-up.html', hvac);

// ── Building Tune-Up ──────────────────────────────────────────
let btu = read('services/building-tune-up.html');
btu = btu.replace(
  `.hero-info-card{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:1.75rem}`,
  `.hero-info-card{display:flex;flex-direction:column;gap:.75rem}`
);
btu = btu.replace(
  `.info-item{display:flex;align-items:flex-start;gap:.75rem;margin-bottom:1rem}`,
  `.info-item{display:flex;align-items:center;gap:.875rem;margin-bottom:0;${ITEM_BOX}}`
);
btu = btu.replace(
  `.info-text span{font-size:.8125rem;color:rgba(255,255,255,.55)}`,
  `.info-text span{font-size:.8125rem;color:rgba(255,255,255,.8)}`
);
write('services/building-tune-up.html', btu);

// ── Lighting stats band ───────────────────────────────────────
let light = read('services/lighting.html');
// Add box to each stat div
light = light.replace(
  `.hero-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;margin-top:2.5rem;padding-top:2.5rem;border-top:1px solid rgba(255,255,255,.1)}`,
  `.hero-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-top:2.5rem;padding-top:2.5rem;border-top:1px solid rgba(255,255,255,.15)}.hero-stats>div{${ITEM_BOX};text-align:center`
);
// Also fix: close the brace properly — add new rule after
light = light.replace(
  `.hero-stats>div{${ITEM_BOX};text-align:center`,
  `.hero-stats>div{${ITEM_BOX};text-align:center}`
);
// Make stat label text more visible
light = light.replace(
  `.hero-stat-lbl{font-size:.8125rem;color:rgba(255,255,255,.55);margin-top:.25rem}`,
  `.hero-stat-lbl{font-size:.8125rem;color:rgba(255,255,255,.8);margin-top:.25rem}`
);
write('services/lighting.html', light);

// ── Community Solar card + steps ─────────────────────────────
let solar = read('services/community-solar.html');
// Outer card: make more opaque/solid
solar = solar.replace(
  `.solar-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:2rem}`,
  `.solar-card{background:rgba(26,35,50,.55);border:1px solid rgba(255,255,255,.2);border-radius:14px;padding:1.5rem;backdrop-filter:blur(8px);display:flex;flex-direction:column;gap:.625rem}`
);
// Each step: own box
solar = solar.replace(
  `.solar-step{display:flex;align-items:flex-start;gap:.75rem;margin-bottom:1rem}`,
  `.solar-step{display:flex;align-items:center;gap:.875rem;margin-bottom:0;${ITEM_BOX}}`
);
// Step subtitle text
solar = solar.replace(
  `.solar-step-text span{font-size:.8125rem;color:rgba(255,255,255,.55)}`,
  `.solar-step-text span{font-size:.8125rem;color:rgba(255,255,255,.8)}`
);
write('services/community-solar.html', solar);

console.log('\n✅ All four pages updated!');
