// See DESIGN-SYSTEM.md, Brand assets: run by hand from website/ with
// node scripts/generate-brand-images.mjs.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';

const MASTER = new URL('../brand/amaleh-logo-transparent.png', import.meta.url);
const OUT_DIR = new URL('../public/brand/', import.meta.url);
const ALPHA_FLOOR = 8;
const PAGE_BG = [0x0f, 0x12, 0x16];
const LOGO_LIMIT = 40 * 1024;
const SHARE_LIMIT = 300 * 1024;

const OUTPUTS = [
  { name: 'amaleh-mark.png', size: 30, limit: LOGO_LIMIT },
  { name: 'amaleh-mark@2x.png', size: 60, limit: LOGO_LIMIT },
  { name: 'favicon-32.png', size: 32, limit: LOGO_LIMIT },
  { name: 'favicon-16.png', size: 16, limit: LOGO_LIMIT },
  { name: 'apple-touch-icon.png', size: 180, background: PAGE_BG, fill: 0.85, limit: LOGO_LIMIT },
  { name: 'amaleh-share.png', size: 600, background: PAGE_BG, fill: 0.6, limit: SHARE_LIMIT },
];

function readPng(path) {
  const buf = readFileSync(path);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${path} is not a PNG`);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (buf[24] !== 8 || buf[25] !== 6 || buf[28] !== 0) {
    throw new Error(`${path} must be a non-interlaced 8-bit RGBA PNG`);
  }
  let pos = 8;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') idat.push(buf.subarray(pos + 8, pos + 8 + len));
    if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y ? pixels.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? cur[x - 4] : 0;
      const b = prev[x];
      const c = x >= 4 ? prev[x - 4] : 0;
      let v = line[x];
      if (filter === 1) v = (v + a) & 255;
      else if (filter === 2) v = (v + b) & 255;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      } else if (filter !== 0) throw new Error(`unknown PNG row filter ${filter}`);
      cur[x] = v;
    }
  }
  return { width, height, pixels };
}

function visibleBox({ width, height, pixels }) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] <= ALPHA_FLOOR) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  if (right < 0) throw new Error('the master logo has no visible pixels');
  return { left, top, right, bottom };
}

function cropSquare({ width, height, pixels }, box) {
  const side = Math.min(
    Math.max(box.right - box.left + 1, box.bottom - box.top + 1),
    width,
    height,
  );
  const clamp = (v, max) => Math.max(0, Math.min(v, max));
  const x0 = clamp(Math.round((box.left + box.right + 1 - side) / 2), width - side);
  const y0 = clamp(Math.round((box.top + box.bottom + 1 - side) / 2), height - side);
  const out = Buffer.alloc(side * side * 4);
  for (let y = 0; y < side; y++) {
    const src = ((y0 + y) * width + x0) * 4;
    pixels.copy(out, y * side * 4, src, src + side * 4);
  }
  return { width: side, height: side, pixels: out };
}

function resample({ width: sw, height: sh, pixels: src }, dw, dh) {
  const out = Buffer.alloc(dw * dh * 4);
  const rx = sw / dw;
  const ry = sh / dh;
  for (let dy = 0; dy < dh; dy++) {
    const sy0 = dy * ry;
    const sy1 = Math.min(sh, (dy + 1) * ry);
    for (let dx = 0; dx < dw; dx++) {
      const sx0 = dx * rx;
      const sx1 = Math.min(sw, (dx + 1) * rx);
      let sumW = 0;
      let sumA = 0;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      for (let sy = Math.floor(sy0); sy < Math.min(sh, Math.ceil(sy1)); sy++) {
        const wy = Math.min(sy + 1, sy1) - Math.max(sy, sy0);
        if (wy <= 0) continue;
        for (let sx = Math.floor(sx0); sx < Math.min(sw, Math.ceil(sx1)); sx++) {
          const wx = Math.min(sx + 1, sx1) - Math.max(sx, sx0);
          if (wx <= 0) continue;
          const w = wx * wy;
          const i = (sy * sw + sx) * 4;
          const wa = w * src[i + 3];
          sumW += w;
          sumA += wa;
          sumR += src[i] * wa;
          sumG += src[i + 1] * wa;
          sumB += src[i + 2] * wa;
        }
      }
      const o = (dy * dw + dx) * 4;
      out[o + 3] = sumW > 0 ? Math.round(sumA / sumW) : 0;
      if (sumA > 0) {
        out[o] = Math.round(sumR / sumA);
        out[o + 1] = Math.round(sumG / sumA);
        out[o + 2] = Math.round(sumB / sumA);
      }
    }
  }
  return { width: dw, height: dh, pixels: out };
}

function flatten(canvas, logo, offsetX, offsetY) {
  for (let y = 0; y < logo.height; y++) {
    for (let x = 0; x < logo.width; x++) {
      const s = (y * logo.width + x) * 4;
      const d = ((offsetY + y) * canvas.width + offsetX + x) * 4;
      const alpha = logo.pixels[s + 3] / 255;
      const inverse = 1 - alpha;
      canvas.pixels[d] = Math.round(logo.pixels[s] * alpha + canvas.pixels[d] * inverse);
      canvas.pixels[d + 1] = Math.round(logo.pixels[s + 1] * alpha + canvas.pixels[d + 1] * inverse);
      canvas.pixels[d + 2] = Math.round(logo.pixels[s + 2] * alpha + canvas.pixels[d + 2] * inverse);
      canvas.pixels[d + 3] = 255;
    }
  }
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function filtered(row, prev, filter) {
  const stride = row.length;
  const out = Buffer.alloc(stride);
  for (let x = 0; x < stride; x++) {
    const a = x >= 4 ? row[x - 4] : 0;
    const b = prev[x];
    const c = x >= 4 ? prev[x - 4] : 0;
    let v = row[x];
    if (filter === 1) v -= a;
    else if (filter === 2) v -= b;
    else if (filter === 3) v -= (a + b) >> 1;
    else if (filter === 4) {
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      v -= pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
    }
    out[x] = v & 255;
  }
  return out;
}

function encodePng({ width, height, pixels }) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y ? pixels.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    let bestFilter = 0;
    let bestScore = Infinity;
    let bestBytes = null;
    for (let filter = 0; filter <= 4; filter++) {
      const candidate = filtered(row, prev, filter);
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const v = candidate[x];
        score += v < 128 ? v : 256 - v;
        if (score >= bestScore) break;
      }
      if (score < bestScore) {
        bestScore = score;
        bestFilter = filter;
        bestBytes = candidate;
      }
    }
    raw[y * (stride + 1)] = bestFilter;
    bestBytes.copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function canvasOf(size, background) {
  const pixels = Buffer.alloc(size * size * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = background[0];
    pixels[i + 1] = background[1];
    pixels[i + 2] = background[2];
    pixels[i + 3] = 255;
  }
  return { width: size, height: size, pixels };
}

const master = readPng(MASTER);
const box = visibleBox(master);
const square = cropSquare(master, box);

mkdirSync(OUT_DIR, { recursive: true });
const failures = [];
const written = [];

for (const spec of OUTPUTS) {
  let image;
  if (spec.background) {
    const logoSize = spec.fill ? Math.round(spec.size * spec.fill) : spec.size;
    const logo = resample(square, logoSize, logoSize);
    image = canvasOf(spec.size, spec.background);
    const offset = Math.round((spec.size - logoSize) / 2);
    flatten(image, logo, offset, offset);
  } else {
    image = resample(square, spec.size, spec.size);
  }
  const png = encodePng(image);
  if (png.length > spec.limit) {
    failures.push(`${spec.name} is ${png.length} bytes, over its ${spec.limit} byte limit`);
  }
  writeFileSync(new URL(spec.name, OUT_DIR), png);
  written.push(`${spec.name} ${image.width}x${image.height} ${png.length} B`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`brand images from ${box.right - box.left + 1}x${box.bottom - box.top + 1} visible pixels in a ${square.width}px square:`);
for (const line of written) console.log(`  ${line}`);