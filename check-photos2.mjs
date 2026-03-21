import puppeteer from 'puppeteer';

// Test new-format Unsplash IDs — CDN URL format differs from old photo-xxx IDs
const photos = [
  ['5CMZB04Ys8w', 'balt-harbor-actionvance'],
  ['WChr3O-HnmE', 'balt-sailship'],
  ['jn7LMoDKK-0', 'balt-boat-golden'],
  ['1nVBujxVJXU', 'balt-highrise'],
  ['V5vF94h52r0', 'office-glass'],
  ['KbEc5BWXX58', 'business-meeting'],
];

const browser = await puppeteer.launch({headless:true,args:['--no-sandbox']});
const page = await browser.newPage();
await page.setViewport({width:900,height:400});

for (const [id, label] of photos) {
  // Try both URL formats
  const url = `https://images.unsplash.com/${id}?w=900&q=60`;
  await page.setContent(`<html><body style="margin:0;background:#000"><img src="${url}" style="width:900px;height:400px;object-fit:cover" onerror="document.body.innerHTML='FAILED:${id}'"></body></html>`);
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({path:`temporary screenshots/p2-${label}.png`});
  console.log('Saved:', label);
}
await browser.close();
