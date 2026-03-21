import puppeteer from 'puppeteer';
const photos = [
  ['photo-1534430480872-3498386e7856', 'baltimore-1'],
  ['photo-1572116469696-31de0f17cc34', 'harbor-2'],
  ['photo-1558618666-fcd25c85cd64', 'harbor-3'],
];
const browser = await puppeteer.launch({headless:true,args:['--no-sandbox']});
const page = await browser.newPage();
await page.setViewport({width:900,height:400});
for (const [id, label] of photos) {
  const url = `https://images.unsplash.com/${id}?w=900&q=60`;
  await page.setContent(`<html><body style="margin:0"><img src="${url}" style="width:900px;height:400px;object-fit:cover"></body></html>`);
  await new Promise(r => setTimeout(r, 3500));
  await page.screenshot({path:`temporary screenshots/photo-${label}.png`});
  console.log('Saved:', label);
}
await browser.close();
