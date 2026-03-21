import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const B = 'C:/Users/kevin/Claudecode/MSE';

const SVG_ARROW = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Root pages — paths without ../
const ROOT_OLD = `<li><a href="empower-maryland.html">EmPOWER Maryland</a></li>`;
const ROOT_NEW = `<li class="dropdown"><a href="empower-maryland.html" style="display:flex;align-items:center;gap:.25rem">EmPOWER Maryland ${SVG_ARROW}</a><div class="dropdown-menu"><a href="empower-maryland.html">EmPOWER Maryland Overview</a><a href="bge-energy-efficiency.html">BGE Programs</a><a href="pepco-energy-efficiency.html">Pepco Programs</a><a href="delmarva-energy-efficiency.html">Delmarva Power Programs</a><a href="smeco-energy-efficiency.html">SMECO Programs</a></div></li>`;

// Sub-pages (services/, blog/) — paths with ../
const SUB_OLD = `<li><a href="../empower-maryland.html">EmPOWER Maryland</a></li>`;
const SUB_NEW = `<li class="dropdown"><a href="../empower-maryland.html" style="display:flex;align-items:center;gap:.25rem">EmPOWER Maryland ${SVG_ARROW}</a><div class="dropdown-menu"><a href="../empower-maryland.html">EmPOWER Maryland Overview</a><a href="../bge-energy-efficiency.html">BGE Programs</a><a href="../pepco-energy-efficiency.html">Pepco Programs</a><a href="../delmarva-energy-efficiency.html">Delmarva Power Programs</a><a href="../smeco-energy-efficiency.html">SMECO Programs</a></div></li>`;

// index.html uses slightly different formatting (spaces around content)
const INDEX_OLD = `          <li><a href="empower-maryland.html">EmPOWER Maryland</a></li>`;
const INDEX_NEW = `          <li class="dropdown"><a href="empower-maryland.html" style="display:flex;align-items:center;gap:.25rem">EmPOWER Maryland ${SVG_ARROW}</a><div class="dropdown-menu"><a href="empower-maryland.html">EmPOWER Maryland Overview</a><a href="bge-energy-efficiency.html">BGE Programs</a><a href="pepco-energy-efficiency.html">Pepco Programs</a><a href="delmarva-energy-efficiency.html">Delmarva Power Programs</a><a href="smeco-energy-efficiency.html">SMECO Programs</a></div></li>`;

function updateFile(filePath, isSubpage) {
  let content = readFileSync(filePath, 'utf8');
  let changed = false;

  if (filePath.includes('index.html') && content.includes(INDEX_OLD)) {
    content = content.replace(INDEX_OLD, INDEX_NEW);
    changed = true;
  } else if (isSubpage && content.includes(SUB_OLD)) {
    content = content.replaceAll(SUB_OLD, SUB_NEW);
    changed = true;
  } else if (!isSubpage && content.includes(ROOT_OLD)) {
    content = content.replaceAll(ROOT_OLD, ROOT_NEW);
    changed = true;
  }

  if (changed) {
    writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

let updated = 0;

// Root pages
for (const f of readdirSync(B).filter(f => f.endsWith('.html'))) {
  const result = updateFile(join(B, f), false);
  if (result) { console.log('✓ root:', f); updated++; }
}

// Services pages
for (const f of readdirSync(join(B, 'services')).filter(f => f.endsWith('.html'))) {
  const result = updateFile(join(B, 'services', f), true);
  if (result) { console.log('✓ services:', f); updated++; }
}

// Blog pages
for (const f of readdirSync(join(B, 'blog')).filter(f => f.endsWith('.html'))) {
  const result = updateFile(join(B, 'blog', f), true);
  if (result) { console.log('✓ blog:', f); updated++; }
}

console.log(`\n✅ Updated ${updated} files.`);
