import puppeteer from 'puppeteer';

const photoIds = [
  '5CMZB04Ys8w',  // Baltimore harbor
  'WChr3O-HnmE',  // Baltimore sail ship  
  'V5vF94h52r0',  // Office glass building
  'KbEc5BWXX58',  // Business meeting
  'jHy5ngFCrg8',  // Business consultation
];

const browser = await puppeteer.launch({headless:true,args:['--no-sandbox']});
const page = await browser.newPage();

for (const id of photoIds) {
  await page.goto(`https://unsplash.com/photos/${id}`, {waitUntil:'domcontentloaded', timeout:15000});
  await new Promise(r => setTimeout(r, 2000));
  // Find the main photo img src
  const imgSrc = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img[src*="images.unsplash.com"]');
    for (const img of imgs) {
      if (img.src.includes('images.unsplash.com') && !img.src.includes('profile') && !img.src.includes('avatar')) {
        return img.src;
      }
    }
    return null;
  });
  const clean = imgSrc ? imgSrc.split('?')[0] : 'NOT FOUND';
  console.log(`${id}: ${clean}`);
}
await browser.close();
