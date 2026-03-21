import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
const B = 'C:/Users/kevin/Claudecode/MSE';
const read = f => readFileSync(join(B, f), 'utf8');
const write = (f, c) => { writeFileSync(join(B, f), c, 'utf8'); console.log('✓', f); };

function rep(content, oldStr, newStr, label) {
  if (!content.includes(oldStr)) { console.log('  ⚠ NOT FOUND:', label || oldStr.substring(0, 70)); return content; }
  return content.replace(oldStr, newStr);
}

// ── 1. "NEARLY ALL MARYLAND" FIXES ───────────────────────────────────────────

let about = read('about.html');
about = rep(about,
  'We Serve <em>All of Maryland</em>',
  'We Serve <em>Nearly All of Maryland</em>',
  'all of Maryland heading'
);
about = rep(about,
  'Authorized by all four major Maryland utilities.',
  'Authorized by all four major Maryland utilities. (Note: a small number of rural electric cooperatives are not covered by EmPOWER Maryland programs.)',
  'about hero sub note'
);
write('about.html', about);

let emp = read('empower-maryland.html');
emp = rep(emp,
  'meaning we can serve businesses anywhere in Maryland',
  'meaning we can serve businesses in nearly all of Maryland',
  'anywhere in MD'
);
write('empower-maryland.html', emp);

let faq = read('faq.html');
faq = rep(faq,
  'We serve the entire state of Maryland, covering all four major utility territories',
  'We serve nearly all of Maryland, covering all four major utility territories',
  'entire state of MD'
);
// Update the FAQ answer about free tune-up — also changes "You pay $0 out of pocket"
faq = rep(faq,
  'You pay $0 out of pocket.',
  'Your cost is $0 after rebates.',
  'FAQ free answer out of pocket'
);
write('faq.html', faq);


// ── 2. HVAC "$0 AFTER REBATES" FIXES ────────────────────────────────────────

let hvac = read('services/hvac-tune-up.html');

// Meta description
hvac = rep(hvac,
  'Get a free commercial HVAC tune-up covered 100% by EmPOWER Maryland.',
  'Get your $0-after-rebates commercial HVAC tune-up through EmPOWER Maryland.',
  'hvac meta'
);
// Hero H1
hvac = rep(hvac,
  'Commercial HVAC Tune-Up — <span>$0 Out-of-Pocket</span>',
  'Commercial HVAC Tune-Up — <span>$0 After Rebates</span>',
  'hvac hero h1'
);
// Program overview paragraph
hvac = rep(hvac,
  'at absolutely no out-of-pocket cost.',
  'at $0 after rebates.',
  'hvac overview para'
);
// CTA section
hvac = rep(hvac,
  'Get your free commercial HVAC tune-up covered by EmPOWER Maryland.',
  'Get your $0-after-rebates commercial HVAC tune-up through EmPOWER Maryland.',
  'hvac CTA'
);
write('services/hvac-tune-up.html', hvac);


// ── 3. INDEX.HTML HVAC LANGUAGE FIXES ───────────────────────────────────────

let idx = read('index.html');

// Why choose card
idx = rep(idx,
  '<h3>$0 Out-of-Pocket Cost</h3>',
  '<h3>$0 After Rebates</h3>',
  'index why-choose card title'
);
idx = rep(idx,
  'it is free for qualifying businesses.',
  "it's $0 after rebates for qualifying businesses.",
  'index why-choose card desc'
);
// Hero subtext
idx = rep(idx,
  'No out-of-pocket cost. No gimmicks.',
  '$0 after rebates. No gimmicks.',
  'index hero sub'
);
// FAQ section on index
idx = rep(idx,
  'You pay nothing out of pocket.',
  'Your cost is $0 after rebates.',
  'index FAQ answer'
);
write('index.html', idx);


// ── 4. CONTACT.HTML ──────────────────────────────────────────────────────────

let contact = read('contact.html');
contact = rep(contact,
  'Schedule a Free HVAC Tune-Up — Contact Maryland Smart Energy',
  'Schedule Your $0 HVAC Tune-Up — Contact Maryland Smart Energy',
  'contact title'
);
contact = rep(contact,
  'Schedule your free commercial HVAC tune-up or energy assessment.',
  'Schedule your $0-after-rebates commercial HVAC tune-up or energy assessment.',
  'contact meta'
);
write('contact.html', contact);

console.log('\n✅ All language fixes applied!');
