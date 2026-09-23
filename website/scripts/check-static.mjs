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
    // A comment is not content: removing it must not glue the text around it
    // together and must not split a token either. The renderer emits its
    // hydration markers as comments between expressions, so a chip rendering
    // `{topic}.md` must still read as one typable string.
    .replace(/<!--[\s\S]*?-->/g, '');
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

/*
 * A lightweight element tree, built on the same tag scanner as eachElement,
 * so a check can ask what is inside a grid instead of guessing from a fixed
 * character window. Offsets index into the same stripped source that
 * eachElement scans, so a node's text is the raw markup between its opening
 * and closing tags.
 */
function parseTree(html) {
  const source = stripNonMarkup(html);
  const root = { tag: '#root', cls: [], children: [], openEnd: 0, end: 0 };
  const stack = [root];
  let m;
  TAG.lastIndex = 0;
  while ((m = TAG.exec(source)) !== null) {
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();

    if (closing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) {
          stack[i].end = m.index;
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const node = {
      tag,
      cls: classTokens(m[3] || ''),
      children: [],
      openEnd: TAG.lastIndex,
      end: TAG.lastIndex,
    };
    stack[stack.length - 1].children.push(node);
    if (!VOID_ELEMENTS.has(tag) && m[4] !== '/') stack.push(node);
  }
  return { root, source };
}

function nodeText(node, source) {
  return source.slice(node.openEnd, node.end).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/*
 * A chip is one token, not a sentence: its own inline markup must not split
 * the string it names, so tags between characters are removed without adding
 * a space. A chip rendering `planning.md` from `{topic}.md` reads as one
 * typable string whether the renderer emitted it as bare text or as nested
 * spans.
 */
function chipText(node, source) {
  return source.slice(node.openEnd, node.end).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/*
 * Running text is a paragraph a reader settles into, not a label and a
 * number. Five or more words that contain a letter is the working threshold:
 * a label-and-number card reads "83 + 95 tests", "USD 0.02", "Verified live",
 * none of which reaches five letter-bearing words, while every prose card in
 * the card grids is a sentence.
 */
function isRunningProse(text) {
  const words = text.split(/\s+/).filter(w => /[a-zA-Z]/.test(w));
  return words.length >= 5;
}

/* Largest column count a grid declares at any breakpoint, or 0 when it
 * declares none. Only numeric `grid-cols-N` utilities count; arbitrary track
 * lists (`grid-cols-[16rem_minmax(0,1fr)_14rem]`) are documentation layout
 * shells, not card grids. */
function declaredColumnCount(cls) {
  let max = 0;
  for (const token of cls) {
    const base = token.includes(':') ? token.slice(token.lastIndexOf(':') + 1) : token;
    const m = base.match(/^grid-cols-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
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

/*
 * Soft chips must carry a hairline edge in their own hue. The component layer
 * of style.css adds border-color to every .badge-soft.badge-* pair; this check
 * verifies that no soft chip on a page exists without a matching hue class,
 * which would mean it escaped the hairline rule.
 */

function checkSoftChipEdges({ file, label }, html) {
  const offenders = [];
  eachElement(html, ({ cls, ancestors }) => {
    if (!cls.includes('badge') || !cls.includes('badge-soft')) return;
    const hasHue = LIGHT_HUES.some(h => cls.includes(h));
    if (!hasHue) {
      offenders.push(cls.join(' '));
    }
  });
  assert.equal(offenders.length, 0,
    `${label}: ${file} carries a soft chip without a hue class: ${offenders.join(', ')}. ` +
    'Every soft chip must carry a hue class (badge-primary, badge-secondary, etc.) ' +
    'so the component-layer hairline edge in style.css applies.');
}

/*
 * font-mono marks a string the reader could type or search: a file path,
 * a CLI operation name, or an environment variable. A chip carrying font-mono
 * whose text does not match any of those patterns is a styling mistake.
 */
const TYPABLE_PATTERNS = [
  /^\.?\.?\//,                  // file path starts with / or ./ or ../
  /^\w[\w.-]*\.\w{1,6}$/,       // filename.ext (e.g. index.html, style.css)
  /^\$\w+/,                     // $ENV_VAR
  /^(?:NODE_ENV|SITE_BASE|PORT|HOST|PATH|HOME|USER|SHELL|LANG|LC_\w+)$/, // common env vars
  /^(?:npm|npx|node|pnpm|yarn|bun|git|curl|wget|cat|ls|grep|find|echo|mkdir|cp|mv|rm)\b/, // CLI commands
  /^(?:\.\/[\w./-]+|[\w./-]+\.\w{1,6})$/, // relative/absolute paths without leading /
];

function isTypableString(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true; // empty chip is not a violation
  return TYPABLE_PATTERNS.some(p => p.test(trimmed));
}

function checkMonoChips({ file, label }, html) {
  const { root, source } = parseTree(html);
  const offenders = [];
  const walk = (node) => {
    const declaresMono = node.cls.some(c => /\bfont-mono\b/.test(c));
    if (node.cls.includes('badge') && declaresMono) {
      const text = chipText(node, source);
      if (text.length > 0 && !isTypableString(text)) offenders.push(text);
    }
    for (const child of node.children) walk(child);
  };
  walk(root);
  assert.equal(offenders.length, 0,
    `${label}: ${file} carries font-mono chips whose text is not a typable string: ${offenders.join(', ')}. ` +
    'font-mono marks file paths, CLI operation names, and environment variables — ' +
    'chips naming a topic, count or status use the sans stack.');
}

/*
 * Hole one: inherited monospace.
 * A chip that declares no font-mono of its own but sits inside an ancestor
 * carrying the font-mono utility renders in monospace anyway. Fail when a
 * badge element has no font utility and any ancestor carries font-mono,
 * unless the chip's text is a typable string (file path, CLI operation name,
 * or environment variable).
 */
function checkInheritedMono({ file, label }, html) {
  const offenders = [];
  const { root, source } = parseTree(html);
  const FONT_MONO = /\bfont-mono\b/;
  const FONT_SANS = /\bfont-sans\b/;

  function hasMono(cls) { return cls.some(c => FONT_MONO.test(c)); }
  function hasSans(cls) { return cls.some(c => FONT_SANS.test(c)); }

  // `nearestFont` carries the font utility that actually wins for a node:
  // the declaration on the nearest ancestor-or-self that declares one.
  // A font-sans declaration stops monospace inheritance at that node and
  // for everything below it, so a chip that corrects the inheritance with
  // font-sans — the remedy this check names — is not a defect.
  function walkInheritedMono(node, nearestFont) {
    const selfMono = hasMono(node.cls);
    const effective = selfMono ? 'mono' : hasSans(node.cls) ? 'sans' : nearestFont;

    if (node.cls.includes('badge') && effective === 'mono' && !selfMono) {
      // This badge inherits font-mono from an ancestor. Check if its text
      // is a typable string; if not, it's a violation.
      const text = chipText(node, source);
      if (text.length > 0 && !isTypableString(text)) {
        offenders.push(text);
      }
    }
    for (const child of node.children) {
      walkInheritedMono(child, effective);
    }
  }
  walkInheritedMono(root, undefined);

  assert.equal(offenders.length, 0,
    `${label}: ${file} has badge(s) inheriting font-mono from an ancestor with non-typable text: ` +
    `${offenders.join(', ')}. A chip without its own font-mono that sits inside a font-mono ancestor ` +
    'renders in monospace by inheritance. If the text is not a file path, CLI operation name, or ' +
    'environment variable, remove font-mono from the ancestor or add font-sans to the chip.');
}

/*
 * Hole two: the heading-and-chip row.
 * DESIGN-SYSTEM.md binds a chip attached to a heading to a
 * 'flex items-start justify-between gap-3' row with 'shrink-0' on the
 * chip, so the chip holds the top-right corner when the heading wraps.
 * Fail when an element whose class list contains both flex and
 * justify-between directly contains a heading and a badge, and does not
 * carry items-start, or whose badge lacks shrink-0.
 */
function checkHeadingChipRow({ file, label }, html) {
  const { root } = parseTree(html);
  const offenders = [];

  const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
  const FLEX = /\bflex\b/;
  const JUSTIFY_BETWEEN = /\bjustify-between\b/;
  const ITEMS_START = /\bitems-start\b/;
  const SHRINK_0 = /\bshrink-0\b/;

  function checkNode(node) {
    const cls = node.cls;
    if (cls.some(c => FLEX.test(c)) && cls.some(c => JUSTIFY_BETWEEN.test(c))) {
      // This is a flex justify-between container. Check if it contains
      // both a heading and a badge as direct children.
      const hasHeading = node.children.some(c => HEADINGS.has(c.tag));
      const hasBadge = node.children.some(c => c.cls.includes('badge'));
      if (hasHeading && hasBadge) {
        const hasItemsStart = cls.some(c => ITEMS_START.test(c));
        const badgeChild = node.children.find(c => c.cls.includes('badge'));
        const badgeHasShrink0 = badgeChild && badgeChild.cls.some(c => SHRINK_0.test(c));

        if (!hasItemsStart || !badgeHasShrink0) {
          const missing = [];
          if (!hasItemsStart) missing.push('items-start on the row');
          if (!badgeHasShrink0) missing.push('shrink-0 on the badge');
          offenders.push(`flex+justify-between row missing ${missing.join(' and ')}`);
        }
      }
    }
    for (const child of node.children) {
      checkNode(child);
    }
  }
  checkNode(root);

  assert.equal(offenders.length, 0,
    `${label}: ${file} has heading-and-chip rows with incorrect layout: ` +
    `${offenders.join('; ')}. A chip attached to a heading must sit in a ` +
    "'flex items-start justify-between gap-3' row with 'shrink-0' on the chip, " +
    'per DESIGN-SYSTEM.md, so the chip holds the top-right corner when the heading wraps.');
}

/*
 * No page may put four paragraph cards into one row. Card grids carrying
 * prose stop at two columns.
 *
 * A prose card grid is a grid that declares a numeric column count above two
 * at any breakpoint (`grid-cols-3`, `xl:grid-cols-4`, …) and has a descendant
 * card holding a <p> of running text. A card whose paragraph is only a label
 * and a number is not prose, so a grid of stat cards past two columns is not
 * a violation. A prose card is any descendant card holding a <p> of running
 * text, so the grid that is blamed is the one that actually contains the
 * card, even when a nested layout grid sits between them.
 */
function checkProseGridColumns({ file, label }, html) {
  const { root, source } = parseTree(html);
  const offenders = new Set();

  // A grid carrying prose is any grid with a descendant card holding running
  // text. Blaming the grid that actually contains the card catches a nested
  // layout grid sitting between the card and its paragraph.
  const hasRunningText = (node) =>
    (node.tag === 'p' && isRunningProse(nodeText(node, source))) ||
    node.children.some(hasRunningText);
  const proseCards = (node, found) => {
    if (node.cls.includes('card') && hasRunningText(node)) found.push(node);
    for (const child of node.children) proseCards(child, found);
  };

  const walk = (node) => {
    if (node.cls.includes('grid') && declaredColumnCount(node.cls) > 2) {
      const cards = [];
      proseCards(node, cards);
      if (cards.length > 0) offenders.add(node.cls.join(' '));
    }
    for (const child of node.children) walk(child);
  };
  walk(root);
  const list = [...offenders];
  assert.equal(list.length, 0,
    `${label}: ${file} has a prose card grid declaring more than two columns: ${list.join('; ')}. ` +
    'Card grids carrying prose stop at two columns per DESIGN-SYSTEM.md.');
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

    // The hairline edge is what makes a soft chip read as a chip on a
    // base-200 card. It lives once in the component layer, so a route that
    // uses the hue is covered; if this rule disappears, every soft chip on
    // every route loses its edge and the pages cannot supply it themselves.
    const edge = css.match(new RegExp(`\\.badge-soft\\.badge-${hue}\\s*\\{([^}]*)\\}`));
    assert.ok(edge,
      `style.css must give every soft chip a hairline edge in its own hue: no .badge-soft.badge-${hue} rule`);
    assert.match(edge[1], /border-color\s*:/,
      `.badge-soft.badge-${hue} must set border-color — the hairline edge in the chip's own hue`);
    assert.ok(
      edge[1].includes(`var(--color-${hue})`) || edge[1].toLowerCase().includes(hueHex.toLowerCase()),
      `.badge-soft.badge-${hue} must draw its edge in the chip's own hue (${hueHex})`);

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
  checkSoftChipEdges(route, route.html);
  checkMonoChips(route, route.html);
  checkInheritedMono(route, route.html);
  checkHeadingChipRow(route, route.html);
  checkProseGridColumns(route, route.html);
  checkContainers(route, route.html);
  if (route.page.startsWith('docs/')) checkDiagramFigure(route, route.html);
}

console.log(`Static verification passed: ${routes.length} fully rendered routes (${routes.map(r => r.label).join(', ')}); headings, titles, brand, metadata, unique ids, contained links and assets, resolvable targets and anchors, .nojekyll, no private/build files, WCAG AA text contrast at Pages base ${base}, night-ledger tokens declared, soft badges ${softRatios.join(', ')}, no colourless chip on a card surface, every container at max-w-7xl and a diagram figure on every documentation route.`);