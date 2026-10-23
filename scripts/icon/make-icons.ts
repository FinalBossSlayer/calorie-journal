// Generates the placeholder app icon set: a bold calorie ring in the accent color.
// Run with `npm run icons`. Replace the PNGs in assets/images/ when a real icon exists.
//
// No image libraries: shapes are drawn with a signed distance function (smooth,
// anti-aliased edges) and encoded as PNG with Node's built-in zlib.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

import { colors } from '../../src/theme/tokens';

type Rgb = [number, number, number];

const OUT_DIR = join(__dirname, '..', '..', 'assets', 'images');

// Ring geometry as fractions of the canvas size.
const RING = {
  radius: 0.3,
  stroke: 0.13,
  // The arc runs clockwise from 12 o'clock and leaves a gap before it closes,
  // like a partly filled calorie ring.
  sweepDeg: 290,
};

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Signed distance (in px) from (x, y) to a round-capped arc; negative is inside. */
function arcDistance(x: number, y: number, size: number, scale: number): number {
  const c = size / 2;
  const r = RING.radius * size * scale;
  const halfStroke = (RING.stroke * size * scale) / 2;
  const dx = x - c;
  const dy = y - c;
  // Angle clockwise from 12 o'clock, 0..360.
  const angle = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  if (angle <= RING.sweepDeg) {
    return Math.abs(Math.hypot(dx, dy) - r) - halfStroke;
  }
  const end = (RING.sweepDeg * Math.PI) / 180;
  const capStart = Math.hypot(dx, dy + r);
  const capEnd = Math.hypot(dx - r * Math.sin(end), dy + r * Math.cos(end));
  return Math.min(capStart, capEnd) - halfStroke;
}

interface IconSpec {
  file: string;
  size: number;
  /** Solid background; omit for transparent. */
  background?: Rgb;
  /** Ring color; omit to draw no ring. */
  ring?: Rgb;
  /** Ring size multiplier (adaptive icons need to stay inside the safe zone). */
  scale?: number;
}

function render({ size, background, ring, scale = 1 }: IconSpec): Buffer {
  // Each row: 1 filter byte (0 = none) + RGBA pixels.
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      const coverage = ring
        ? Math.min(1, Math.max(0, 0.5 - arcDistance(x + 0.5, y + 0.5, size, scale)))
        : 0;
      let rgba: [number, number, number, number];
      if (background) {
        const [br, bg, bb] = background;
        const [rr, rg, rb] = ring ?? background;
        rgba = [
          br + (rr - br) * coverage,
          bg + (rg - bg) * coverage,
          bb + (rb - bb) * coverage,
          255,
        ];
      } else {
        const [rr, rg, rb] = ring ?? [0, 0, 0];
        rgba = [rr, rg, rb, 255 * coverage];
      }
      const o = y * stride + 1 + x * 4;
      for (let i = 0; i < 4; i++) raw[o + i] = Math.round(rgba[i]);
    }
  }
  return encodePng(size, size, raw);
}

// --- Minimal PNG encoder -------------------------------------------------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width: number, height: number, raw: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Icon set ------------------------------------------------------------

const dark = {
  background: hexToRgb(colors.dark.background),
  accent: hexToRgb(colors.dark.accent),
};
const light = { accent: hexToRgb(colors.light.accent) };
const white: Rgb = [255, 255, 255];

// Android adaptive icons are cropped to a shape (circle, squircle…); only the
// centre ~66% is guaranteed visible, so the ring is drawn smaller there.
const ADAPTIVE_SCALE = 0.72;

const icons: IconSpec[] = [
  { file: 'icon.png', size: 1024, background: dark.background, ring: dark.accent },
  { file: 'android-icon-background.png', size: 512, background: dark.background },
  { file: 'android-icon-foreground.png', size: 512, ring: dark.accent, scale: ADAPTIVE_SCALE },
  // Themed icons (Android 13+): only the alpha channel is used, the system tints it.
  { file: 'android-icon-monochrome.png', size: 432, ring: white, scale: ADAPTIVE_SCALE },
  // Splash image sits on the theme background, so each mode gets its own accent.
  { file: 'splash-icon.png', size: 256, ring: light.accent },
  { file: 'splash-icon-dark.png', size: 256, ring: dark.accent },
  { file: 'favicon.png', size: 48, background: dark.background, ring: dark.accent },
];

for (const spec of icons) {
  writeFileSync(join(OUT_DIR, spec.file), render(spec));
  console.log(`wrote assets/images/${spec.file} (${spec.size}×${spec.size})`);
}
