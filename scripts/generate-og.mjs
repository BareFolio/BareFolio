import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

// Read SVG content
const isologo = readFileSync(resolve(publicDir, 'ISOLOGO WHITE.svg'), 'utf8');
const logotipo = readFileSync(resolve(publicDir, 'Logotipo White.svg'), 'utf8');

// Dimensions
const W = 1200, H = 630;

// Scale logos to look good at OG size
// Isologo: 314×303 native → render at 72px tall
const isoH = 72, isoW = Math.round((314 / 303) * isoH); // ~74px
// Logotipo: 546×106 native → render at 58px tall
const logoH = 58, logoW = Math.round((546 / 106) * logoH); // ~299px

const gap = 22; // gap between isologo and logotipo
const totalW = isoW + gap + logoW;
const startX = Math.round((W - totalW) / 2);
const centerY = Math.round((H - Math.max(isoH, logoH)) / 2);

// Build composite SVG
const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#101010"/>
  <image href="data:image/svg+xml;base64,${Buffer.from(isologo).toString('base64')}"
    x="${startX}" y="${centerY + Math.round((logoH - isoH) / 2)}"
    width="${isoW}" height="${isoH}"/>
  <image href="data:image/svg+xml;base64,${Buffer.from(logotipo).toString('base64')}"
    x="${startX + isoW + gap}" y="${centerY}"
    width="${logoW}" height="${logoH}"/>
</svg>`;

const outPath = resolve(publicDir, 'og.jpg');

await sharp(Buffer.from(svg))
  .jpeg({ quality: 92 })
  .toFile(outPath);

console.log(`✓ og.jpg generated at ${outPath}`);
