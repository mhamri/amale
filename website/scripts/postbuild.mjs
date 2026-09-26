import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_ROUTES, canonicalUrl } from '../src/lib/seo.ts';

const publicDir = fileURLToPath(new URL('../.output/public/', import.meta.url));

await rm(new URL('../.output/public/.vite/', import.meta.url), { recursive: true, force: true });

// nitro.json records the wall-clock time of the build. Nothing in the published
// site reads it, and keeping it makes every build produce a different tree,
// which breaks any verification that compares a build against the tree it ran on.
await rm(new URL('../.output/nitro.json', import.meta.url), { force: true });

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...CONTENT_ROUTES.map((path) => `  <url><loc>${canonicalUrl(path)}</loc></url>`),
  '</urlset>',
  '',
].join('\n');
await writeFile(join(publicDir, 'sitemap.xml'), sitemap);

async function shareImageSize() {
  try {
    const png = await readFile(join(publicDir, 'brand/amaleh-share.png'));
    if (png.length < 24 || png.readUInt32BE(0) !== 0x89504e47) return null;
    return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  } catch {
    return null;
  }
}

const shareSize = await shareImageSize();
if (shareSize) {
  const entries = await readdir(publicDir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const file = join(entry.parentPath, entry.name);
    const html = await readFile(file, 'utf8');
    const sized = html
      .replace(/(property="og:image:width"[^>]*content=")\d+(")/g, `$1${shareSize.width}$2`)
      .replace(/(property="og:image:height"[^>]*content=")\d+(")/g, `$1${shareSize.height}$2`);
    if (sized !== html) await writeFile(file, sized);
  }
}
