import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalUrl } from '../src/lib/seo.ts';

const publicDir = fileURLToPath(new URL('../.output/public/', import.meta.url));
const robotsNoindex = /<meta\b(?=[^>]*\bname="robots")(?=[^>]*\bcontent="[^"]*\bnoindex\b)[^>]*>/i;

await rm(new URL('../.output/public/.vite/', import.meta.url), { recursive: true, force: true });

// nitro.json records the wall-clock time of the build. Nothing in the published
// site reads it, and keeping it makes every build produce a different tree,
// which breaks any verification that compares a build against the tree it ran on.
await rm(new URL('../.output/nitro.json', import.meta.url), { force: true });

async function indexableRoutes() {
  const routes = [];
  for (const entry of await readdir(publicDir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || entry.name !== 'index.html') continue;
    const html = await readFile(join(entry.parentPath, entry.name), 'utf8');
    if (robotsNoindex.test(html)) continue;
    const directory = relative(publicDir, entry.parentPath).split(sep).join('/');
    routes.push(directory ? `${directory}/` : '');
  }
  return routes.sort();
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...(await indexableRoutes()).map((route) => `  <url><loc>${canonicalUrl(route)}</loc></url>`),
  '</urlset>',
  '',
].join('\n');
await writeFile(join(publicDir, 'sitemap.xml'), sitemap);
