// Renders the PNG icons from inline SVG using the Chromium that Playwright ships.
// Run with `npm run icons` after changing the artwork; the PNGs are committed.
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const ACCENT = '#b4532a';

// `scale` shrinks the artwork: maskable icons need a safe zone, iOS icons need no rounded corners.
const artwork = ({ rounded, scale }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="${ACCENT}"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <circle cx="256" cy="256" r="150" fill="#faf6f1"/>
    <circle cx="256" cy="256" r="108" fill="none" stroke="#e5dacd" stroke-width="10"/>
    <path fill="#d9902a" d="M256 178l22.9 46.5 51.3 7.4-37.1 36.2 8.8 51.1L256 295.1l-45.9 24.1 8.8-51.1-37.1-36.2 51.3-7.4z"/>
  </g>
</svg>`;

const icons = [
  { path: 'public/icons/icon-192.png', size: 192, rounded: true, scale: 1 },
  { path: 'public/icons/icon-512.png', size: 512, rounded: true, scale: 1 },
  { path: 'public/icons/icon-maskable-512.png', size: 512, rounded: false, scale: 0.8 },
  { path: 'public/apple-touch-icon.png', size: 180, rounded: false, scale: 0.95 },
];

await mkdir('public/icons', { recursive: true });
const browser = await chromium.launch();
try {
  for (const icon of icons) {
    const page = await browser.newPage({ viewport: { width: icon.size, height: icon.size } });
    await page.setContent(
      `<body style="margin:0;background:transparent">${artwork(icon)}</body>`,
    );
    await page.screenshot({ path: icon.path, omitBackground: true });
    await page.close();
    console.log(`wrote ${icon.path}`);
  }
} finally {
  await browser.close();
}
