// One-off generator: samples the dark strokes of public/models/TypeSafe.png into
// src/components/case-study/jev-mark-field.ts. Run with node from website/.
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const buf = readFileSync('public/models/TypeSafe.png');
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
let pos = 8;
const idat = [];
const palette = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString('ascii', pos + 4, pos + 8);
  if (type === 'PLTE') {
    for (let i = 0; i < len; i += 3) palette.push([buf[pos + 8 + i], buf[pos + 9 + i], buf[pos + 10 + i]]);
  }
  if (type === 'IDAT') idat.push(buf.slice(pos + 8, pos + 8 + len));
  pos += 12 + len;
}
const raw = inflateSync(Buffer.concat(idat));
const stride = width;
const pixels = Buffer.alloc(height * stride);
for (let y = 0; y < height; y++) {
  const f = raw[y * (stride + 1)];
  const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
  const prev = y ? pixels.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
  const cur = pixels.subarray(y * stride, (y + 1) * stride);
  for (let x = 0; x < stride; x++) {
    const a = x >= 1 ? cur[x - 1] : 0;
    const b = prev[x];
    const c = x >= 1 ? prev[x - 1] : 0;
    let v = line[x];
    if (f === 1) v = (v + a) & 255;
    else if (f === 2) v = (v + b) & 255;
    else if (f === 3) v = (v + ((a + b) >> 1)) & 255;
    else if (f === 4) {
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
    }
    cur[x] = v;
  }
}

const DARK_LUMINANCE = 80;
function isDark(x, y) {
  const c = palette[pixels[y * stride + x]];
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] < DARK_LUMINANCE;
}

let top = Infinity, bottom = -1, left = Infinity, right = -1;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (!isDark(x, y)) continue;
    if (y < top) top = y;
    if (y > bottom) bottom = y;
    if (x < left) left = x;
    if (x > right) right = x;
  }
}
const markWidth = right - left + 1;
const markHeight = bottom - top + 1;

const RAMP = ' .:-=+*#%@';
const STEP = 2;
const cols = Math.ceil(markWidth / STEP);
const rowCount = Math.ceil(markHeight / STEP);
const rows = [];
for (let fy = 0; fy < rowCount; fy++) {
  let line = '';
  for (let fx = 0; fx < cols; fx++) {
    let dark = 0;
    let total = 0;
    for (let py = top + fy * STEP; py < Math.min(top + (fy + 1) * STEP, bottom + 1); py++) {
      for (let px = left + fx * STEP; px < Math.min(left + (fx + 1) * STEP, right + 1); px++) {
        total++;
        if (isDark(px, py)) dark++;
      }
    }
    const coverage = total ? dark / total : 0;
    line += coverage === 0 ? ' ' : RAMP[Math.min(RAMP.length - 1, Math.max(1, Math.round(coverage * (RAMP.length - 1))))];
  }
  rows.push(line);
}

const out = `export const MARK_FIELD = {
  rows: [
${rows.map((r) => `    ${JSON.stringify(r)},`).join('\n')}
  ],
  originX: ${left},
  originY: ${top},
  step: ${STEP},
  cols: ${cols},
  rowCount: ${rowCount},
  markWidthPx: ${markWidth},
  markHeightPx: ${markHeight},
  centreX: ${(left + markWidth / 2).toFixed(1)},
  centreY: ${(top + markHeight / 2).toFixed(1)},
} as const;
`;
writeFileSync('src/components/case-study/jev-mark-field.ts', out);
console.log(`field: ${rowCount} rows x ${cols} cols, mark ${markWidth}x${markHeight}px at (${left},${top})`);
