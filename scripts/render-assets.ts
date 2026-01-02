import { promises as fs } from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.join(process.cwd(), 'dist', 'assets');

async function ensureDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

function generateWordCloudPlaceholder() {
  const words = [
    { text: 'sevgi', weight: 14 },
    { text: 'günaydın', weight: 12 },
    { text: 'plan', weight: 10 },
    { text: 'kahve', weight: 8 },
    { text: 'mola', weight: 7 },
    { text: 'özledim', weight: 6 },
    { text: 'randevu', weight: 5 }
  ];
  const width = 800;
  const height = 400;
  const positions = words.map((w, i) => ({
    ...w,
    x: 60 + i * 100,
    y: 60 + ((i % 2) * 120)
  }));
  const textNodes = positions
    .map(
      (w) => `<text x="${w.x}" y="${w.y}" font-size="${w.weight * 4}" fill="url(#grad)" font-family="Inter, sans-serif">${w.text}</text>`
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D71F5D" />
      <stop offset="100%" stop-color="#2E294E" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="#0B132B" rx="24" />
  ${textNodes}
</svg>`;
}

async function main() {
  await ensureDir();
  const svg = generateWordCloudPlaceholder();
  const target = path.join(OUTPUT_DIR, 'wordcloud.svg');
  await fs.writeFile(target, svg, 'utf-8');
  console.log(`Wordcloud placeholder created → ${target}`);
}

main();
