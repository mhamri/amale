import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = fileURLToPath(new URL('../.output/public/', import.meta.url));
const stylePath = fileURLToPath(new URL('../src/style.css', import.meta.url));

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
    assert.match(html, /AH-mah-lah/, "" + label + ": " + file + " must render the pronunciation");
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
await checkContrast();

console.log(`Static verification passed: ${routes.length} fully rendered routes (${routes.map(r => r.label).join(', ')}); headings, titles, brand, metadata, unique ids, contained links and assets, resolvable targets and anchors, .nojekyll, no private/build files, and WCAG AA text contrast at Pages base ${base}.`);
