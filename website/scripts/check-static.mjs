import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = fileURLToPath(new URL('../.output/public/', import.meta.url));
const stylePath = fileURLToPath(new URL('../src/style.css', import.meta.url));
const designPath = fileURLToPath(new URL('../DESIGN-SYSTEM.md', import.meta.url));

const routes = [
  { file: 'index.html',            page: 'index.html',           label: '/' },
  { file: 'docs/index.html',       page: 'docs/index.html',      label: '/docs/' },
  { file: 'docs/getting-started/index.html', page: 'docs/getting-started/index.html', label: '/docs/getting-started/' },
  { file: 'docs/workflow/index.html',        page: 'docs/workflow/index.html',        label: '/docs/workflow/' },
  { file: 'docs/review-and-recovery/index.html', page: 'docs/review-and-recovery/index.html', label: '/docs/review-and-recovery/' },
  { file: 'docs/commands/index.html',        page: 'docs/commands/index.html',        label: '/docs/commands/' },
  { file: 'evidence/index.html',            page: 'evidence/index.html',            label: '/evidence/' },
];

const base = process.env.SITE_BASE || '/';
assert.ok(base.startsWith('/') && base.endsWith('/') && !base.includes('..'),
  `SITE_BASE must be an absolute URL path with leading and trailing slashes, got ${JSON.stringify(base)}`);


function readPage(p)   { return readFile(resolve(publicDir, p), 'utf8'); }
function readCSS()    { return readFile(stylePath, 'utf8'); }
function readDesign() { return readFile(designPath, 'utf8'); }

function extractCSSVariables(css) {
  const vars = {};
  for (const m of css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    vars[m[1]] = m[2];
  }
  return vars;
}

function channel(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrastRatio(fg, bg) {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

/*
 * daisyUI 5 renders a soft badge (and every `-soft` component variant) as the
 * component colour itself over an 8% tint of that colour mixed into base-100:
 *
 *   color-mix(in oklab, var(--color-<hue>) 8%, var(--color-base-100))
 *
 * These helpers reproduce that mix, convert the result back to sRGB, and
 * measure WCAG relative luminance — the same method DESIGN-SYSTEM.md records
 * its soft-fill ratios with.
 */
function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function linearToSrgb(c) {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, v)) * 255);
}
function hexToRgb(hex) {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
}
// Linear-light sRGB -> Oklab (Björn Ottosson's matrices), then back again.
function linearToOklab(r, g, b) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}
function oklabToRgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ];
}
function softBadgeFill(hueHex, baseHex, weight) {
  const hue = hexToRgb(hueHex).map(srgbToLinear);
  const bg = hexToRgb(baseHex).map(srgbToLinear);
  const a = linearToOklab(...hue);
  const b = linearToOklab(...bg);
  const mixed = a.map((v, i) => v * weight + b[i] * (1 - weight));
  return '#' + oklabToRgb(...mixed).map(v => v.toString(16).padStart(2, '0')).join('');
}

function resolveLinkTarget(link, pageDir, basePath) {
  if (/^(https?:|mailto:|data:|tel:)/i.test(link) || link.startsWith('#') || link.startsWith('javascript:')) {
    return null;
  }
  const decoded = decodeURIComponent(link.replaceAll('&amp;', '&'));
  const pageBase = `https://site.test${basePath}${pageDir}`;
  return { url: new URL(decoded, pageBase) };
}

async function checkPage({ file, page, label }) {
  const html = await readPage(file);

  assert.match(html, /<h1[\s>]/, `${label}: ${file} must contain a prerendered <h1>`);
  assert.match(html, /<title[^>]*>[^<]+<\/title>/, `${label}: ${file} must contain a <title>`);

  const expectsName = page === "index.html" || page === "docs/index.html" || page === "evidence/index.html";
  if (expectsName) {
    assert.match(html, /عمله/, "" + label + ": " + file + " must render عمله");
    assert.match(html, /Ah-mah-leh/, "" + label + ": " + file + " must render the pronunciation");
    assert.match(html, /workers [/] laborers/, "" + label + ": " + file + " must render the meaning");
  }

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
  if (titleMatch) {
    assert.ok(!titleMatch[1].includes('عمله'),
      `${label}: <title> must not contain the Persian word`);
  }

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length,
    `${label}: ${file} must have unique element ids`);

  assert.match(html, /name="description"/, `${label}: ${file} must declare a meta description`);

  const pageDir = dirname(page) + '';
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (raw.startsWith('#')) {
      assert.ok(raw.length === 1 || ids.includes(raw.slice(1)),
        `${label}: ${file} same-page anchor ${raw} has no matching id in this page`);
      continue;
    }
    const resolved = resolveLinkTarget(raw, pageDir, base);
    if (resolved === null) continue;

  assert.ok(resolved.url.pathname.startsWith(base),
      `${label}: ${file} link ${raw} escapes the Pages base ${base}`);

    let targetPath = decodeURIComponent(resolved.url.pathname.slice(base.length));
    if (targetPath === '' || targetPath.endsWith('/')) {
      targetPath = targetPath + 'index.html';
    }
    const targetFile = resolve(publicDir, targetPath);
    let info;
    try { info = await stat(targetFile); }
    catch { info = null; }
    assert.ok(info !== null && info.isFile(),
      `${label}: ${file} link ${raw} has no resolvable target on disk (resolved to ${targetPath})`);

    if (resolved.url.hash && targetPath.endsWith('.html')) {
      const destHtml = await readPage(targetPath);
      assert.ok(destHtml.includes(`id="${resolved.url.hash.slice(1)}"`),
        `${label}: ${file} anchor ${raw} has no matching id in ${targetPath}`);
    }
  }
}

/*
 * The visualization layer is pages of markup whose meaning must survive with
 * no JavaScript, so the contract is checked against the prerendered HTML
 * itself rather than against the components that produced it. A tiny tag
 * scanner gives each opening element its ancestor chain without pulling in a
 * DOM parser.
 */
const VOID_ELEMENTS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;

function stripNonMarkup(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

function classTokens(attrs) {
  const m = attrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/);
  return m ? (m[1] ?? m[2]).split(/\s+/).filter(Boolean) : [];
}

function eachElement(html, visit) {
  const source = stripNonMarkup(html);
  const stack = [];
  let m;
  TAG.lastIndex = 0;
  while ((m = TAG.exec(source)) !== null) {
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const attrs = m[3] || '';
    const selfClosing = m[4] === '/';

    if (closing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) { stack.length = i; break; }
      }
      continue;
    }

    const cls = classTokens(attrs);
    visit({ tag, cls, ancestors: stack.slice() });
    if (!VOID_ELEMENTS.has(tag) && !selfClosing) stack.push({ tag, cls });
  }
}

const SURFACE = /^bg-(?:base-200|base-300|raised)(?:\/\d+)?$/;
const LIGHT_HUES = ['badge-primary', 'badge-secondary', 'badge-accent', 'badge-info', 'badge-success', 'badge-warning', 'badge-error'];

const MAX_WIDTH_REM = {
  'max-w-3xs': 16, 'max-w-2xs': 18, 'max-w-xs': 20, 'max-w-sm': 24, 'max-w-md': 28,
  'max-w-lg': 32, 'max-w-xl': 36, 'max-w-2xl': 42, 'max-w-3xl': 48, 'max-w-4xl': 56,
  'max-w-5xl': 64, 'max-w-6xl': 72, 'max-w-7xl': 80,
  'max-w-screen-sm': 40, 'max-w-screen-md': 48, 'max-w-screen-lg': 64,
  'max-w-screen-xl': 80, 'max-w-screen-2xl': 96,
  'max-w-prose': 32,
};

/** Width of a `max-w-*` utility in rem, or null when it is not a known cap. */
function maxWidthRem(token) {
  const base = token.includes(':') ? token.slice(token.lastIndexOf(':') + 1) : token;
  if (Object.hasOwn(MAX_WIDTH_REM, base)) return MAX_WIDTH_REM[base];
  const arbitrary = base.match(/^max-w-\[([\d.]+)(rem|px)\]$/);
  if (arbitrary) return arbitrary[2] === 'rem' ? parseFloat(arbitrary[1]) : parseFloat(arbitrary[1]) / 16;
  return null;
}

function onCardSurface(cls, ancestors) {
  return cls.some(c => SURFACE.test(c)) || ancestors.some(a => a.cls.some(c => SURFACE.test(c)));
}

function checkChips({ file, label }, html) {
  const offenders = [];
  eachElement(html, ({ cls, ancestors }) => {
    const isBadge = cls.includes('badge');
    if (!isBadge) return;
    const hueCoded = LIGHT_HUES.some(h => cls.includes(h));
    if (hueCoded) return;
    if (!onCardSurface(cls, ancestors)) return;
    offenders.push(cls.includes('badge-neutral') ? 'badge-neutral' : 'a chip with no hue');
  });
  assert.equal(offenders.length, 0,
    `${label}: ${file} puts ${offenders[0]} on a card surface (bg-base-200/300/raised). ` +
    'A neutral or hueless chip reads as unpainted graphite on graphite; hue-code it per DESIGN-SYSTEM.md ' +
    'or move it into base-100 page chrome.');
}

function checkContainers({ file, label }, html) {
  const offenders = [];
  eachElement(html, ({ tag, cls }) => {
    if (!cls.includes('mx-auto') || !cls.includes('w-full')) return;
    // A page container is the wrapper that centers content in the viewport:
    // it carries the responsive gutter padding (or is a <section>), unlike an
    // inner block that merely centers itself at a narrower measure.
    const padded = cls.some(c => /^(?:[a-z0-9]+:)*px-/.test(c));
    if (tag !== 'section' && !padded) return;
    const caps = cls.map(maxWidthRem).filter(v => v !== null);
    const narrow = caps.filter(v => v < 80);
    if (narrow.length > 0) offenders.push(`${tag} (${cls.join(' ')})`);
  });
  assert.equal(offenders.length, 0,
    `${label}: ${file} uses a section container narrower than max-w-7xl: ${offenders.join(', ')}. ` +
    'DESIGN-SYSTEM.md fixes every section wrapper and the header/footer container at mx-auto w-full max-w-7xl.');
}

function checkDiagramFigure({ file, label }, html) {
  let diagram = false;
  eachElement(html, ({ tag, ancestors }) => {
    if (tag !== 'svg' && tag !== 'canvas') return;
    if (ancestors.some(a => a.tag === 'figure')) diagram = true;
  });
  assert.ok(diagram,
    `${label}: ${file} must carry at least one <figure> containing a diagram (<svg> or <canvas>), ` +
    'per the visualization layer in DESIGN-SYSTEM.md.');
}

/*
 * style.css is the only stylesheet and must carry every token the design
 * system names — the night-ledger palette, the extension tokens the pages and
 * the visualization layer compose from, and the reduced-motion block.
 */
const PALETTE = {
  'color-base-100': '#0f1216',
  'color-base-200': '#161c22',
  'color-base-300': '#20272f',
  'color-base-content': '#e8edf3',
  'color-primary': '#e2a45c',
  'color-primary-content': '#221505',
  'color-secondary': '#5cc9b4',
  'color-secondary-content': '#06231d',
  'color-accent': '#b7a3f2',
  'color-accent-content': '#1c1030',
  'color-neutral': '#262d35',
  'color-neutral-content': '#dfe5eb',
  'color-info': '#7fc3e8',
  'color-info-content': '#0a2231',
  'color-success': '#63cfa0',
  'color-success-content': '#06251a',
  'color-warning': '#e2a45c',
  'color-warning-content': '#221505',
  'color-error': '#ef8a80',
  'color-error-content': '#2b0b08',
  'color-dim': '#a3adb9',
  'color-line': '#2b333c',
  'color-raised': '#161c22',
};

const DECLARED_TOKENS = [
  'font-display', 'font-sans', 'font-mono',
  'text-hero', 'text-display', 'text-title',
  'shadow-rest', 'shadow-raised',
  'ease-out-soft', 'animate-rise',
  'radius-box', 'radius-field',
];

async function checkDesignTokens() {
  const css = await readCSS();
  const vars = extractCSSVariables(css);

  for (const [token, hex] of Object.entries(PALETTE)) {
    assert.ok(vars[token],
      `style.css must declare --${token} as a hex colour (the night-ledger palette)`);
    assert.equal(vars[token].toLowerCase(), hex,
      `style.css declares --${token} ${vars[token]} but the design system fixes it at ${hex}`);
  }

  for (const token of DECLARED_TOKENS) {
    assert.match(css, new RegExp(`--${token}\\s*:`),
      `style.css must declare --${token}, which DESIGN-SYSTEM.md names as a page token`);
  }

  assert.match(css, /@keyframes\s+rise\b/,
    'style.css must keep the rise keyframes used by animate-rise');
  assert.match(css, /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/,
    'style.css must keep the prefers-reduced-motion block that stops all CSS motion');
  assert.match(css, /animation-duration:\s*0\.01ms\s*!important/,
    'the prefers-reduced-motion block must still collapse animation durations');
  assert.match(css, /transition-duration:\s*0\.01ms\s*!important/,
    'the prefers-reduced-motion block must still collapse transition durations');
}

const SOFT_HUES = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'];

async function checkSoftBadges() {
  const css = await readCSS();
  const design = await readDesign();
  const vars = extractCSSVariables(css);
  const baseHex = vars['color-base-100'];
  assert.ok(baseHex, 'style.css must declare --color-base-100 as a hex colour');

  const documented = new Map();
  for (const m of design.matchAll(/(primary|secondary|accent|info|warning|success|error)\s+`(#[0-9a-fA-F]{6})`\s+on\s+`(#[0-9a-fA-F]{6})`\s*\*\*([\d.]+):1\*\*/g)) {
    documented.set(m[1], { hue: m[2].toLowerCase(), fill: m[3].toLowerCase(), ratio: parseFloat(m[4]) });
  }

  const reported = [];
  for (const hue of SOFT_HUES) {
    const hueHex = vars[`color-${hue}`];
    assert.ok(hueHex, `style.css must declare --color-${hue} for the ${hue} soft badge`);
    const fill = softBadgeFill(hueHex, baseHex, 0.08);
    const ratio = contrastRatio(hueHex, fill);
    assert.ok(ratio >= 4.5,
      `Soft badge ${hue}: ${hueHex} on its soft fill ${fill} is ${ratio.toFixed(2)}:1, below the WCAG AA 4.5:1 floor`);
    const record = documented.get(hue);
    assert.ok(record, `DESIGN-SYSTEM.md must record the measured soft-badge ratio for ${hue}`);
    assert.equal(hueHex.toLowerCase(), record.hue,
      `DESIGN-SYSTEM.md records soft badge ${hue} at ${record.hue} but style.css declares ${hueHex}`);
    assert.ok(Math.abs(ratio - record.ratio) <= 0.1,
      `Soft badge ${hue} computes ${ratio.toFixed(2)}:1 but DESIGN-SYSTEM.md records ${record.ratio}:1`);
    reported.push(`${hue} ${ratio.toFixed(2)}:1`);
  }

  return reported;
}

async function checkOutputSanity() {
  await stat(resolve(publicDir, '.nojekyll'));

  const rootEntries = await readdir(publicDir);
  const forbidden = new Set(['.amale', '.git', 'node_modules', 'package.json', '.output', '.vite']);
  for (const name of rootEntries) {
    assert.ok(!forbidden.has(name),
      `Private or build files must not ship at the output root: ${name}`);
  }
}

async function checkContrast() {
  const css = await readCSS();
  const vars = extractCSSVariables(css);

  const pairs = [
    ['color-base-content', 'color-base-100'],
    ['color-base-content', 'color-base-200'],
    ['color-dim',          'color-base-100'],
    ['color-dim',          'color-base-200'],
    ['color-primary',      'color-base-100'],
    ['color-primary',      'color-base-200'],
    ['color-primary-content', 'color-primary'],
    ['color-secondary',    'color-base-100'],
    ['color-secondary-content', 'color-secondary'],
    ['color-accent',       'color-base-100'],
    ['color-accent-content',  'color-accent'],
    ['color-neutral-content', 'color-neutral'],
    ['color-info',         'color-base-100'],
    ['color-success',      'color-base-100'],
    ['color-error',        'color-base-100'],
  ];

  for (const [fgToken, bgToken] of pairs) {
    const fg = vars[fgToken];
    const bg = vars[bgToken];
    assert.ok(fg && bg, `style.css must declare --${fgToken} and --${bgToken} as hex values`);
    const ratio = contrastRatio(fg, bg);
    assert.ok(ratio >= 4.5,
      `Contrast ${ratio.toFixed(2)}:1 for ${fgToken} (${fg}) on ${bgToken} (${bg}) must be at least 4.5:1`);
  }
}


await Promise.all(routes.map(checkPage));
await checkOutputSanity();
await checkDesignTokens();
const softRatios = await checkSoftBadges();
await checkContrast();

const pages = await Promise.all(routes.map(async route => {
  const html = await readPage(route.file);
  return { ...route, html };
}));
for (const route of pages) {
  checkChips(route, route.html);
  checkContainers(route, route.html);
  if (route.page.startsWith('docs/')) checkDiagramFigure(route, route.html);
}

console.log(`Static verification passed: ${routes.length} fully rendered routes (${routes.map(r => r.label).join(', ')}); headings, titles, brand, metadata, unique ids, contained links and assets, resolvable targets and anchors, .nojekyll, no private/build files, WCAG AA text contrast at Pages base ${base}, night-ledger tokens declared, soft badges ${softRatios.join(', ')}, no colourless chip on a card surface, every container at max-w-7xl and a diagram figure on every documentation route.`);