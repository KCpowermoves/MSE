import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
const B = 'C:/Users/kevin/Claudecode/MSE';
const read = f => readFileSync(join(B, f), 'utf8');
const write = (f, c) => writeFileSync(join(B, f), c, 'utf8');

function rep(content, oldStr, newStr) {
  if (!content.includes(oldStr)) { console.log('  ⚠ NOT FOUND:', oldStr.substring(0,70)); return content; }
  return content.replace(oldStr, newStr);
}

// ── 1. HERO IMAGE UPDATES ─────────────────────────────────────
const HERO_PATTERN = /content:'';position:absolute;inset:0;background:linear-gradient\(rgba\(26,35,50,\.62\),rgba\(26,35,50,\.62\)\),url\('[^']+'\) center\/cover no-repeat;pointer-events:none;z-index:0\} \.page-hero>\*\{position:relative;z-index:1\}/;
const heroCSS = (url) => `content:'';position:absolute;inset:0;background:linear-gradient(rgba(26,35,50,.62),rgba(26,35,50,.62)),url('${url}') center/cover no-repeat;pointer-events:none;z-index:0} .page-hero>*{position:relative;z-index:1}`;

const heroUpdates = [
  ['about.html',                    'brand_assets/image%20files/wp2071759-baltimore-wallpapers.jpg'],
  ['empower-maryland.html',         'brand_assets/image%20files/benchmarking-hero.jpg'],
  ['blog.html',                     'brand_assets/image%20files/community-solar-side.jpg'],
  ['faq.html',                      'brand_assets/image%20files/building-tuneup-side.jpg'],
  ['contact.html',                  'brand_assets/image%20files/hvac-tune-up-side.jpg'],
  ['bge-energy-efficiency.html',    'brand_assets/image%20files/energy-supply-side.jpg'],
  ['pepco-energy-efficiency.html',  'brand_assets/image%20files/lighting-side.jpg'],
  ['delmarva-energy-efficiency.html','brand_assets/image%20files/benchmarking-side.jpg'],
  ['smeco-energy-efficiency.html',  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1400&q=80'],
];

for (const [file, imgUrl] of heroUpdates) {
  let c = read(file);
  if (HERO_PATTERN.test(c)) {
    c = c.replace(HERO_PATTERN, heroCSS(imgUrl));
    write(file, c);
    console.log('✓ Hero:', file);
  } else {
    console.log('⚠ No hero pattern in:', file);
  }
}

// ── 2. BLOG.HTML — card images + featured + phone fix ─────────
let blog = read('blog.html');

blog = rep(blog,
  '.post-card-img.hvac-bg{background:linear-gradient(135deg,#1A2332 0%,#243047 100%)}',
  ".post-card-img.hvac-bg{background:linear-gradient(rgba(26,35,50,.45),rgba(26,35,50,.45)),url('brand_assets/image%20files/hvac-tune-up-side.jpg') center/cover no-repeat}"
);
blog = rep(blog,
  '.post-card-img.lighting-bg{background:linear-gradient(135deg,#2a1a0a 0%,#4a2c0e 100%)}',
  ".post-card-img.lighting-bg{background:linear-gradient(rgba(26,35,50,.45),rgba(26,35,50,.45)),url('brand_assets/image%20files/lighting-side.jpg') center/cover no-repeat}"
);
blog = rep(blog,
  '.post-card-img.empower-bg{background:linear-gradient(135deg,#1a0a0a 0%,#3a1010 100%)}',
  ".post-card-img.empower-bg{background:linear-gradient(rgba(26,35,50,.45),rgba(26,35,50,.45)),url('brand_assets/image%20files/benchmarking-hero.jpg') center/cover no-repeat}"
);
blog = rep(blog,
  '.post-card-img.case-bg{background:linear-gradient(135deg,#0a1a2a 0%,#0f2a40 100%)}',
  ".post-card-img.case-bg{background:linear-gradient(rgba(26,35,50,.45),rgba(26,35,50,.45)),url('brand_assets/image%20files/building-tuneup-side.jpg') center/cover no-repeat}"
);
blog = rep(blog,
  '.featured-img{background:linear-gradient(135deg,#243047 0%,#1A2332 50%,#0f1820 100%);display:flex;align-items:center;justify-content:center;padding:2.5rem;position:relative;overflow:hidden}',
  ".featured-img{background:linear-gradient(rgba(26,35,50,.55),rgba(26,35,50,.55)),url('brand_assets/image%20files/hvac-hero-background.jpg') center/cover no-repeat;display:flex;align-items:center;justify-content:center;padding:2.5rem;position:relative;overflow:hidden}"
);
// Fix phone number link getting button styles
blog = rep(blog,
  '<a href="tel:3018887090" style="color:#fff;font-weight:700">(301) 888-7090</a>',
  '<a href="tel:3018887090" style="color:#fff;font-weight:700;background:transparent;display:inline;padding:0">(301) 888-7090</a>'
);
write('blog.html', blog);
console.log('✓ blog.html — card photos + featured + phone fixed');

// ── 3. EMPOWER MARYLAND — remove 3 non-EmPOWER cards ─────────
let emp = read('empower-maryland.html');
const commSolarStart = '        <div class="program-card">\n          <div class="prog-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"';
const energySupplyEnd = '          <div style="margin-top:.875rem"><a href="services/energy-supply.html" style="font-family:\'Barlow\',sans-serif;font-weight:700;font-size:.875rem;color:#C8102E;text-decoration:none">Learn More \u2192</a></div>\n        </div>';
const startIdx = emp.indexOf(commSolarStart);
const endIdx = emp.indexOf(energySupplyEnd);
if (startIdx > -1 && endIdx > -1) {
  emp = emp.substring(0, startIdx) + emp.substring(endIdx + energySupplyEnd.length);
  write('empower-maryland.html', emp);
  console.log('✓ empower-maryland.html — 3 cards removed');
} else {
  console.log('⚠ Could not find card boundaries in empower-maryland.html', startIdx, endIdx);
}

// ── 4. BLOG POSTS — add inline images ─────────────────────────
const imgTag = (src, alt) => `<img src="${src}" alt="${alt}" style="width:100%;height:280px;object-fit:cover;border-radius:10px;margin:2rem 0 1.5rem">\n    `;

// HVAC post
let hvac = read('blog/commercial-hvac-tune-up-signs.html');
hvac = rep(hvac,
  '<h2>When Replacement IS the Right Call</h2>',
  imgTag('../brand_assets/image files/hvac-tune-up-side.jpg', 'HVAC technician servicing a commercial rooftop unit') + '<h2>When Replacement IS the Right Call</h2>'
);
write('blog/commercial-hvac-tune-up-signs.html', hvac);
console.log('✓ HVAC post — image added');

// Lighting post
let light = read('blog/led-lighting-warehouse-savings.html');
light = rep(light,
  '<h2>The Numbers: Project Cost and Payback</h2>',
  imgTag('../brand_assets/image files/lighting-side.jpg', 'Commercial LED lighting in a Maryland warehouse') + '<h2>The Numbers: Project Cost and Payback</h2>'
);
write('blog/led-lighting-warehouse-savings.html', light);
console.log('✓ Lighting post — image added');

// Rockville post — find second h2
let rock = read('blog/rockville-medical-building-tune-up.html');
const rockH2s = [...rock.matchAll(/<h2>[^<]+<\/h2>/g)];
if (rockH2s.length >= 2) {
  const target = rockH2s[1][0];
  rock = rep(rock, target, imgTag('../brand_assets/image files/building-tuneup-side.jpg', 'Commercial building energy assessment') + target);
}
write('blog/rockville-medical-building-tune-up.html', rock);
console.log('✓ Rockville post — image added');

// HB864 post — find second h2
let hb = read('blog/hb864-maryland-energy-law-2024.html');
const hbH2s = [...hb.matchAll(/<h2>[^<]+<\/h2>/g)];
if (hbH2s.length >= 2) {
  const target = hbH2s[1][0];
  hb = rep(hb, target, imgTag('../brand_assets/image files/benchmarking-side.jpg', 'Maryland energy benchmarking and compliance') + target);
}
write('blog/hb864-maryland-energy-law-2024.html', hb);
console.log('✓ HB864 post — image added');

console.log('\n✅ All fixes applied!');
