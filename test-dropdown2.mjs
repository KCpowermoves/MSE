import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({headless:true,args:['--no-sandbox']});
const page = await browser.newPage();
await page.setViewport({width:1280,height:800});
await page.goto('http://localhost:3000/empower-maryland.html', {waitUntil:'networkidle0'});

// Force ALL dropdown menus open
await page.evaluate(() => {
  document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'block');
});
await page.screenshot({path:'temporary screenshots/empower-all-dropdowns.png'});

// Count dropdowns
const count = await page.evaluate(() => document.querySelectorAll('.dropdown-menu').length);
console.log('Dropdown menus found:', count);

// Check if EmPOWER dropdown has items
const items = await page.evaluate(() => {
  const menus = document.querySelectorAll('.dropdown-menu');
  return Array.from(menus).map((m,i) => `Menu ${i}: ${m.children.length} items, first="${m.children[0]?.textContent}"`);
});
items.forEach(i => console.log(i));

await browser.close();
