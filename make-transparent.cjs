const { Jimp } = require('jimp');

(async () => {
  const img = await Jimp.read('./MSE/brand_assets/images/mse-gray-logo.png');
  const data = img.bitmap.data;
  const { width, height } = img.bitmap;

  // Sample background from corner
  const ri = 2 * 4 * width + 2 * 4; // rough pixel index
  const r = data[ri], g = data[ri+1], b = data[ri+2];
  console.log(`Background: rgb(${r}, ${g}, ${b})`);

  const tolerance = 28;

  for (let i = 0; i < data.length; i += 4) {
    const pr = data[i], pg = data[i+1], pb = data[i+2];
    const diff = Math.abs(pr - r) + Math.abs(pg - g) + Math.abs(pb - b);
    if (diff < tolerance) {
      data[i + 3] = 0; // alpha = 0 (transparent)
    }
  }

  await img.write('./MSE/brand_assets/images/mse-gray-logo.png');
  console.log('Done — background made transparent.');
})();
