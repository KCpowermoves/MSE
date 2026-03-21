import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({headless:true,args:['--no-sandbox']});
const page = await browser.newPage();
await page.setViewport({width:1280,height:800});
await page.goto('http://localhost:3000/empower-maryland.html', {waitUntil:'networkidle0'});
// Force dropdown open via JS
await page.evaluate(() => {
  const menu = document.querySelector('.dropdown-menu');
  if (menu) menu.style.display = 'block';
});
await page.screenshot({path:'temporary screenshots/empower-dropdown-forced.png'});
// Now check what element is on top at the nav dropdown area using elementFromPoint
const topEl = await page.evaluate(() => {
  const el = document.elementFromPoint(640, 50); // roughly nav center
  return el ? el.tagName + '.' + el.className : 'none';
});
console.log('Element at nav center:', topEl);
// Check z-index of hero vs site-header
const styles = await page.evaluate(() => {
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.page-hero');
  return {
    headerZIndex: getComputedStyle(header).zIndex,
    headerPosition: getComputedStyle(header).position,
    heroZIndex: getComputedStyle(hero).zIndex,
    heroPosition: getComputedStyle(hero).position,
  };
});
console.log('Computed styles:', styles);
await browser.close();
