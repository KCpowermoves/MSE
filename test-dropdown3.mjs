import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({headless:true,args:['--no-sandbox']});
const page = await browser.newPage();
await page.setViewport({width:1280,height:800});
await page.goto('http://localhost:3000/empower-maryland.html', {waitUntil:'networkidle0'});

// Get position of the EmPOWER dropdown li
const info = await page.evaluate(() => {
  const dropdowns = document.querySelectorAll('.dropdown');
  return Array.from(dropdowns).map((d, i) => {
    const rect = d.getBoundingClientRect();
    const menu = d.querySelector('.dropdown-menu');
    const menuRect = menu ? menu.getBoundingClientRect() : null;
    return {
      index: i,
      text: d.querySelector('a')?.textContent?.trim(),
      li: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width) },
      menu: menuRect ? { x: Math.round(menuRect.x), y: Math.round(menuRect.y), w: Math.round(menuRect.width) } : null
    };
  });
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
