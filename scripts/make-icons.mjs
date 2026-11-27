// Generates the placeholder app icons (a plain dial) into public/.
// Usage: npm run icons
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

function dial({ size, padding }) {
  const c = size / 2;
  const r = size / 2 - padding;
  const ticks = Array.from({ length: 10 }, (_, i) => {
    const a = (i * 36 * Math.PI) / 180;
    const r1 = r * 0.78;
    const r2 = r * (i === 0 ? 0.6 : 0.68);
    return `<line x1="${c + r1 * Math.sin(a)}" y1="${c - r1 * Math.cos(a)}" x2="${c + r2 * Math.sin(a)}" y2="${c - r2 * Math.cos(a)}"
      stroke="#f4f3ef" stroke-width="${size * (i === 0 ? 0.035 : 0.022)}" stroke-linecap="round"/>`;
  }).join('');
  const handA = (8 * 36 * Math.PI) / 180;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#1c5a46"/>
    <circle cx="${c}" cy="${c}" r="${r}" fill="#123d30" stroke="#f4f3ef" stroke-width="${size * 0.02}"/>
    ${ticks}
    <line x1="${c}" y1="${c}" x2="${c + r * 0.55 * Math.sin(handA)}" y2="${c - r * 0.55 * Math.cos(handA)}"
      stroke="#e8c36a" stroke-width="${size * 0.03}" stroke-linecap="round"/>
    <circle cx="${c}" cy="${c}" r="${size * 0.035}" fill="#e8c36a"/>
  </svg>`;
}

const jobs = [
  ['apple-touch-icon.png', 180, 18],
  ['icon-192.png', 192, 20],
  ['icon-512.png', 512, 52],
  ['icon-maskable-512.png', 512, 110],
];

for (const [file, size, padding] of jobs) {
  await sharp(Buffer.from(dial({ size, padding }))).png().toFile(path.join(out, file));
  console.log('wrote', file);
}
