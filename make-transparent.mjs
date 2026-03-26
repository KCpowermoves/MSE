import Jimp from 'jimp';

const img = await Jimp.read('./brand_assets/images/mse-gray-logo.png');

// Sample the background color from top-left corner
const bgColor = img.getPixelColor(2, 2);
const r = (bgColor >> 24) & 0xff;
const g = (bgColor >> 16) & 0xff;
const b = (bgColor >> 8) & 0xff;
console.log(`Background color detected: rgb(${r}, ${g}, ${b})`);

const tolerance = 30;

img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
  const pr = this.bitmap.data[idx];
  const pg = this.bitmap.data[idx + 1];
  const pb = this.bitmap.data[idx + 2];

  const diff = Math.abs(pr - r) + Math.abs(pg - g) + Math.abs(pb - b);
  if (diff < tolerance) {
    this.bitmap.data[idx + 3] = 0; // make transparent
  }
});

await img.writeAsync('./brand_assets/images/mse-gray-logo.png');
console.log('Saved with transparent background.');
