import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/kevin/Claudecode/node_modules/puppeteer');

const browser = await puppeteer.launch({headless:'new',args:['--no-sandbox','--disable-setuid-sandbox']});
const page = await browser.newPage();
await page.setViewport({width:1440,height:900,deviceScaleFactor:2});
await page.goto('http://localhost:3000',{waitUntil:'networkidle0'});

const footerY = await page.evaluate(() => document.querySelector('footer').offsetTop);
await page.screenshot({path:'./footer-logo-zoom.png', clip:{x:0, y:footerY, width:500, height:220}});
console.log('footer at y:', footerY);
await browser.close();
