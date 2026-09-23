// Rendered inspection of the built site, as a check that leaves a receipt.
//
// The type check and the static check read source and markup. Neither can see
// a page that scrolls sideways at 320 pixels, a diagram label clipped at a card
// edge, or an animation that keeps running under prefers-reduced-motion. Those
// have each shipped at least once in this project and were only ever caught by
// pointing a browser at the built output.
//
// It needs a browser it does not own. Puppeteer is resolved from wherever the
// machine already has it; when nothing is installed the check reports that it
// skipped and exits 0, so a machine without a browser is not blocked and CI
// does not gain a Chromium download it never asked for.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const publicDir = fileURL('../.output/public/');
const widths = [320, 390, 768, 1024, 1440];
const routes = [
  '/',
  '/docs/',
  '/docs/getting-started/',
  '/docs/workflow/',
  '/docs/review-and-recovery/',
  '/docs/commands/',
  '/case-study/',
];

function fileURL(relative) {
  return resolve(new URL(relative, import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
}

async function loadPuppeteer() {
  const require = createRequire(import.meta.url);
  const candidates = [
    'puppeteer',
    'puppeteer-core',
    `${process.env.USERPROFILE ?? process.env.HOME ?? ''}/.bun/install/global/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js`,
  ];
  for (const candidate of candidates) {
    try {
      const specifier = candidate.includes('/')
        ? pathToFileURL(candidate).href
        : pathToFileURL(require.resolve(candidate)).href;
      const loaded = await import(specifier);
      return loaded.default ?? loaded;
    } catch {
      // Try the next location.
    }
  }
  return null;
}

const contentTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.md': 'text/plain',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function serve(root) {
  return createServer(async (request, response) => {
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let file = resolve(root, path.replace(/^\//, ''));
      if (file !== root && !file.startsWith(root + sep)) {
        response.writeHead(404).end();
        return;
      }
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      const type = contentTypes[extname(file)] ?? 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });
}

const inspectLayout = () => ({
  horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  headings: document.querySelectorAll('h1').length,
});

const inspectLabels = () => {
  const problems = [];
  document.querySelectorAll('svg').forEach((svg) => {
    const view = svg.viewBox.baseVal;
    if (!view || view.width === 0) return;
    const area = view.width * view.height;
    const cards = [...svg.querySelectorAll('rect')]
      .map((rect) => rect.getBBox())
      .filter(
        (box) =>
          box.width > view.width * 0.04 &&
          box.height > view.height * 0.04 &&
          box.width * box.height < area * 0.55,
      );
    for (const label of svg.querySelectorAll('text')) {
      const box = label.getBBox();
      const text = label.textContent.trim().slice(0, 40);
      if (
        box.x < view.x - 0.5 ||
        box.y < view.y - 0.5 ||
        box.x + box.width > view.x + view.width + 0.5 ||
        box.y + box.height > view.y + view.height + 0.5
      ) {
        problems.push({ kind: 'escapes-viewbox', text });
        continue;
      }
      for (const card of cards) {
        const overlapX = Math.min(box.x + box.width, card.x + card.width) - Math.max(box.x, card.x);
        const overlapY = Math.min(box.y + box.height, card.y + card.height) - Math.max(box.y, card.y);
        if (overlapX <= 0 || overlapY <= 0) continue;
        const inside =
          box.x >= card.x - 0.5 &&
          box.y >= card.y - 0.5 &&
          box.x + box.width <= card.x + card.width + 0.5 &&
          box.y + box.height <= card.y + card.height + 0.5;
        if (!inside) {
          problems.push({ kind: 'straddles-card', text });
          break;
        }
      }
    }
  });
  return problems;
};

const puppeteer = await loadPuppeteer();
if (!puppeteer) {
  console.log(
    'Rendered inspection skipped: no puppeteer installation was found. ' +
      'Install puppeteer to run the 320/390/768/1024/1440 layout sweep, the label geometry sweep, ' +
      'the JavaScript-disabled pass and the reduced-motion pass.',
  );
  process.exit(0);
}

const stepTimeoutMs = 30000;
const runTimeoutMs = 300000;
const watchdog = setTimeout(() => {
  console.error(`Rendered inspection gave up after ${runTimeoutMs / 1000}s without finishing; a page never settled.`);
  process.exit(1);
}, runTimeoutMs);
watchdog.unref();

function withinStep(promise, what) {
  let timer;
  const expired = new Promise((_, fail) => {
    timer = setTimeout(() => fail(new Error(`${what} did not finish within ${stepTimeoutMs / 1000}s`)), stepTimeoutMs);
  });
  return Promise.race([promise, expired]).finally(() => clearTimeout(timer));
}

async function openPage(browser) {
  const page = await browser.newPage();
  page.setDefaultTimeout(stepTimeoutMs);
  page.setDefaultNavigationTimeout(stepTimeoutMs);
  return page;
}

const server = serve(publicDir);
await new Promise((ready) => server.listen(0, '127.0.0.1', ready));
const origin = `http://127.0.0.1:${server.address().port}`;
const failures = [];
let checkedPages = 0;
let browser;

try {
  browser = await puppeteer.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });

  for (const route of routes) {
    for (const width of widths) {
      const page = await openPage(browser);
      try {
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text());
        });
        await page.setViewport({ width, height: 900 });
        await page.goto(origin + route, { waitUntil: 'networkidle0' });
        await new Promise((settled) => setTimeout(settled, 250));

        const layout = await withinStep(page.evaluate(inspectLayout), `${route} at ${width}px layout inspection`);
        if (layout.horizontalOverflow) {
          failures.push(
            `${route} at ${width}px scrolls horizontally: scrollWidth ${layout.scrollWidth} against clientWidth ${layout.clientWidth}`,
          );
        }
        if (layout.headings !== 1) {
          failures.push(`${route} at ${width}px has ${layout.headings} h1 elements, expected exactly 1`);
        }
        for (const error of errors) failures.push(`${route} at ${width}px logged an error: ${error}`);

        if (width === 320 || width === 768 || width === 1440) {
          for (const problem of await withinStep(page.evaluate(inspectLabels), `${route} at ${width}px label inspection`)) {
            failures.push(`${route} at ${width}px: label "${problem.text}" ${problem.kind}`);
          }
        }
        checkedPages += 1;
      } catch (error) {
        failures.push(`${route} at ${width}px could not be inspected: ${error.message}`);
      } finally {
        await page.close().catch(() => {});
      }
    }
  }

  for (const route of routes) {
    const page = await openPage(browser);
    try {
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(origin + route, { waitUntil: 'networkidle0' });
      await withinStep(
        page.evaluate(() => {
          window.__scheduled = 0;
          const request = window.requestAnimationFrame;
          window.requestAnimationFrame = (callback) => {
            window.__scheduled += 1;
            return request(callback);
          };
        }),
        `${route} reduced-motion setup`,
      );
      await new Promise((settled) => setTimeout(settled, 900));
      const moving = await withinStep(
        page.evaluate(() => ({
          scheduled: window.__scheduled,
          running: document.getAnimations().filter((animation) => animation.playState === 'running').length,
        })),
        `${route} reduced-motion inspection`,
      );
      if (moving.scheduled > 0 || moving.running > 0) {
        failures.push(
          `${route} keeps animating under prefers-reduced-motion: ${moving.scheduled} animation frames scheduled, ${moving.running} running animations`,
        );
      }
    } catch (error) {
      failures.push(`${route} under prefers-reduced-motion could not be inspected: ${error.message}`);
    } finally {
      await page.close().catch(() => {});
    }
  }

  for (const route of routes) {
    const page = await openPage(browser);
    try {
      await page.setJavaScriptEnabled(false);
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
      const text = await withinStep(
        page.evaluate(() => document.body.innerText.trim().length),
        `${route} JavaScript-disabled inspection`,
      );
      if (text < 400) {
        failures.push(`${route} renders only ${text} characters with JavaScript disabled`);
      }
    } catch (error) {
      failures.push(`${route} with JavaScript disabled could not be inspected: ${error.message}`);
    } finally {
      await page.close().catch(() => {});
    }
  }
} catch (error) {
  failures.push(`Rendered inspection could not run: ${error.message}`);
} finally {
  await browser?.close().catch(() => {});
  server.close();
  clearTimeout(watchdog);
}

if (failures.length > 0) {
  console.error(`Rendered inspection failed with ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `Rendered inspection passed: ${routes.length} routes at ${widths.join('/')} CSS pixels ` +
    `(${checkedPages} page loads); no horizontal overflow, exactly one h1 per route, no console or page errors, ` +
    'no SVG label escaping its viewBox or straddling a card edge, no animation under prefers-reduced-motion, ' +
    'and every route still readable with JavaScript disabled.',
);
