import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.join(__dirname, '../public');
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.png')) {
    const inputPath = path.join(dir, file);
    const stat = fs.statSync(inputPath);
    // Only convert files larger than 100KB to save time, or just convert all large background images.
    if (stat.size > 100000) {
      const outputPath = path.join(dir, file.replace('.png', '.webp'));
      sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath)
        .then(() => console.log(`Converted ${file} to WebP`))
        .catch(err => console.error(`Error converting ${file}:`, err));
    }
  }
}
