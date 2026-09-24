import { MARK_FIELD } from './jev-mark-field.ts';

export const CHAR_RAMP = ' .:-=+*#%@';
const RAMP_MAX = CHAR_RAMP.length - 1;
export const ADVANCE_EM = 0.6;
export const CELL_HEIGHT_EM = 1.1;
export const ROWS = 50;
export const COLS = Math.round(
  (ROWS * CELL_HEIGHT_EM * (MARK_FIELD.markWidthPx / MARK_FIELD.markHeightPx)) / ADVANCE_EM,
);
export const EM_WIDTH = COLS * ADVANCE_EM;
const EM_PER_PX = (EM_WIDTH * 0.88) / MARK_FIELD.markWidthPx;
const EXTRUDE_PX = 36;
const HALF_EXTRUDE = EXTRUDE_PX / 2;
const MARCH_STEP_PX = 2;
const HIT_COVERAGE = 0.45;
const FLAT_GRADIENT = 0.02;
const LIGHT = normalise([0.6, -0.45, 0.5]);

export const REST_TILT_X = 0.1;
export const REST_TILT_Y = 0;
export const REST_SPIN = -0.12;
const YAW_LIMIT = 0.6;

type Vec3 = [number, number, number];

function normalise(v: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
}

const FIELD_COLS = MARK_FIELD.rows[0].length;
const FIELD_ROW_COUNT = MARK_FIELD.rows.length;
const COVERAGE = new Float32Array(FIELD_COLS * FIELD_ROW_COUNT);
const GRADIENT_X = new Float32Array(FIELD_COLS * FIELD_ROW_COUNT);
const GRADIENT_Y = new Float32Array(FIELD_COLS * FIELD_ROW_COUNT);

for (let i = 0; i < COVERAGE.length; i++) {
  COVERAGE[i] = CHAR_RAMP.indexOf(MARK_FIELD.rows[(i / FIELD_COLS) | 0][i % FIELD_COLS]) / RAMP_MAX;
}
for (let fy = 0; fy < FIELD_ROW_COUNT; fy++) {
  for (let fx = 0; fx < FIELD_COLS; fx++) {
    const x0 = COVERAGE[fy * FIELD_COLS + Math.max(0, fx - 1)];
    const x1 = COVERAGE[fy * FIELD_COLS + Math.min(FIELD_COLS - 1, fx + 1)];
    const y0 = COVERAGE[Math.max(0, fy - 1) * FIELD_COLS + fx];
    const y1 = COVERAGE[Math.min(FIELD_ROW_COUNT - 1, fy + 1) * FIELD_COLS + fx];
    GRADIENT_X[fy * FIELD_COLS + fx] = (x1 - x0) / (2 * MARK_FIELD.step);
    GRADIENT_Y[fy * FIELD_COLS + fx] = (y1 - y0) / (2 * MARK_FIELD.step);
  }
}

function fieldCellAt(px: number, py: number): number {
  const fx = Math.round((px - MARK_FIELD.originX) / MARK_FIELD.step - 0.5);
  const fy = Math.round((py - MARK_FIELD.originY) / MARK_FIELD.step - 0.5);
  if (fx < 0 || fy < 0 || fx >= FIELD_COLS || fy >= FIELD_ROW_COUNT) return -1;
  return fy * FIELD_COLS + fx;
}

function firstHit(
  sxPx: number,
  syPx: number,
  c0: number,
  s0: number,
  c1: number,
  s1: number,
  rayX: number,
  rayY: number,
  rayZ: number,
): number {
  const baseX = c1 * sxPx + s0 * s1 * syPx;
  const baseY = c0 * syPx;
  const baseZ = s1 * sxPx - s0 * c1 * syPx;
  const dirX = -c0 * s1;
  const dirY = s0;
  const dirZ = c0 * c1;

  let ztHi = Infinity;
  let ztLo = -Infinity;
  const halfWidth = MARK_FIELD.markWidthPx / 2 + 2;
  const halfHeight = MARK_FIELD.markHeightPx / 2 + 2;

  if (Math.abs(dirX) > 1e-9) {
    const t1 = (halfWidth - baseX) / dirX;
    const t2 = (-halfWidth - baseX) / dirX;
    ztHi = Math.min(ztHi, Math.max(t1, t2));
    ztLo = Math.max(ztLo, Math.min(t1, t2));
  } else if (Math.abs(baseX) > halfWidth) return -1;

  if (Math.abs(dirY) > 1e-9) {
    const t1 = (halfHeight - baseY) / dirY;
    const t2 = (-halfHeight - baseY) / dirY;
    ztHi = Math.min(ztHi, Math.max(t1, t2));
    ztLo = Math.max(ztLo, Math.min(t1, t2));
  } else if (Math.abs(baseY) > halfHeight) return -1;

  if (Math.abs(dirZ) > 1e-9) {
    const t1 = (HALF_EXTRUDE - baseZ) / dirZ;
    const t2 = (-HALF_EXTRUDE - baseZ) / dirZ;
    ztHi = Math.min(ztHi, Math.max(t1, t2));
    ztLo = Math.max(ztLo, Math.min(t1, t2));
  } else if (Math.abs(baseZ) > HALF_EXTRUDE) return -1;

  if (ztLo > ztHi) return -1;

  for (let zt = ztHi; zt >= ztLo; zt -= MARCH_STEP_PX) {
    const cell = fieldCellAt(
      MARK_FIELD.centreX + baseX + dirX * zt,
      MARK_FIELD.centreY + baseY + dirY * zt,
    );
    if (cell < 0 || COVERAGE[cell] < HIT_COVERAGE) continue;
    const pz = baseZ + dirZ * zt;
    let nx = GRADIENT_X[cell];
    let ny = GRADIENT_Y[cell];
    const magnitude = Math.hypot(nx, ny);
    let nz = 0;
    if (magnitude < FLAT_GRADIENT) {
      nx = 0;
      ny = 0;
      nz = pz >= 0 ? 1 : -1;
    } else {
      nx /= magnitude;
      ny /= magnitude;
      if (nx * rayX + ny * rayY > 0) {
        nx = -nx;
        ny = -ny;
      }
    }
    const nxView = c1 * nx + s1 * nz;
    const nyView = s0 * s1 * nx + c0 * ny - s0 * c1 * nz;
    const nzView = -c0 * s1 * nx + s0 * ny + c0 * c1 * nz;
    const diffuse = Math.max(0, nxView * LIGHT[0] + nyView * LIGHT[1] + nzView * LIGHT[2]);
    const depthFactor = (pz + HALF_EXTRUDE) / EXTRUDE_PX;
    const brightness =
      (0.22 + 0.78 * diffuse) * (0.6 + 0.4 * depthFactor) * (0.5 + 0.5 * COVERAGE[cell]);
    return Math.min(RAMP_MAX, Math.max(1, Math.round(brightness * RAMP_MAX)));
  }
  return -1;
}

export function renderFrame(tiltX: number, tiltY: number, spinY: number): string {
  const c0 = Math.cos(tiltX);
  const s0 = Math.sin(tiltX);
  const yaw = Math.max(-YAW_LIMIT, Math.min(YAW_LIMIT, spinY + tiltY));
  const c1 = Math.cos(yaw);
  const s1 = Math.sin(yaw);
  const rayX = c0 * s1;
  const rayY = -s0;
  const rayZ = -c0 * c1;
  const lines: string[] = [];
  for (let gy = 0; gy < ROWS; gy++) {
    const syPx = ((gy + 0.5) * CELL_HEIGHT_EM - (ROWS * CELL_HEIGHT_EM) / 2) / EM_PER_PX;
    let line = '';
    for (let gx = 0; gx < COLS; gx++) {
      const sxPx = ((gx + 0.5) * ADVANCE_EM - EM_WIDTH / 2) / EM_PER_PX;
      const ramp = firstHit(sxPx, syPx, c0, s0, c1, s1, rayX, rayY, rayZ);
      line += ramp < 0 ? ' ' : CHAR_RAMP[ramp];
    }
    lines.push(line);
  }
  return lines.join('\n');
}

export const STILL_FRAME = renderFrame(REST_TILT_X, REST_TILT_Y, REST_SPIN);
