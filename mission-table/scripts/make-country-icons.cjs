// Builds each country's home-screen app icon from its photo in public/images/countries.
// Run after adding a country: node scripts/make-country-icons.cjs
// Then add the slug to COUNTRY_ICONS in src/lib/appIcons.ts.
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const root = path.join(__dirname, '..', 'public');
const slugs = fs.readdirSync(path.join(root, 'images/countries')).filter((f) => f.endsWith('.jpg')).map((f) => f.slice(0, -4));
fs.mkdirSync(path.join(root, 'icons/countries'), { recursive: true });

(async () => {
  for (const slug of slugs) {
    const src = path.join(root, 'images/countries', `${slug}.jpg`);
    const crop = (size) => sharp(src).resize(size, size, { fit: 'cover', position: sharp.strategy.attention });
    // Apple wants a PNG; the larger ones are JPEG to keep the files small.
    await crop(180).png({ compressionLevel: 9 }).toFile(path.join(root, 'icons/countries', `${slug}-180.png`));
    for (const size of [192, 512]) {
      await crop(size).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(root, 'icons/countries', `${slug}-${size}.jpg`));
    }
    console.log('icon:', slug);
  }
})();
