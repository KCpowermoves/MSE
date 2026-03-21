import puppeteer from 'puppeteer';

const photos = [
  ['photo-1501594907352-04cda38ebc29', 'city-waterfront-1'],
  ['photo-1444723121867-7a241cacace9', 'city-water-2'],
  ['photo-1477959858617-67f85cf4f1df', 'city-skyline-3'],
  ['photo-1529083609195-bebd9e0f9f4d', 'aerial-city-4'],
  ['photo-1449824913935-59a10b8d2000', 'city-night-5'],
  ['photo-1486406146926-c627a92ad1ab', 'office-buildings'],
  ['photo-1556761175-4b46a572b786', 'office-meeting'],
  ['photo-1521791136064-7986c2920216', 'handshake'],
];

const browser = await puppeteer.launch({headless:true,args:['--no-sandbox']});
const page = await browser.newPage();
await page.setViewport({width:800,height:350});

for (const [id, label] of photos) {
  const url = `https://images.unsplash.com/${id}?w=800&q=60`;
  await page.setContent(`<html><body style="margin:0;background:#111"><img src="${url}" style="width:800px;height:350px;object-fit:cover"></body></html>`);
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({path:`temporary screenshots/city-${label}.png`});
  console.log('✓', label);
}
await browser.close();
