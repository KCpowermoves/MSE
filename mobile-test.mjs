import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = 'file:///' + __dirname.replace(/\/g, '/');

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({width: 390, height: 844, deviceScaleFactor: 2});

// Test index
await page.goto(`${base}/index.html`, {waitUntil: 'domcontentloaded'});
await page.screenshot({path: 'ss-mobile-home.png'});

// Test nav area only (top 200px)
await page.screenshot({path: 'ss-mobile-nav.png', clip: {x:0, y:0, width:390, height:200}});

console.log('Screenshots saved');
await browser.close();
