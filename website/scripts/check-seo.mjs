// See website/SEO.md — verifies the built output carries the metadata, structured data and sitemap the site promises.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CASE_STUDY_PATH,
  CONTENT_ROUTES,
  EVIDENCE_PATH,
  SHARE_IMAGE_URL,
  SITE_NAME,
  TWITTER_HANDLE,
  canonicalUrl,
} from '../src/lib/seo.ts';
import { SITE_URL } from '../src/lib/links.ts';

const publicDir = fileURLToPath(new URL('../.output/public/', import.meta.url));

if (!existsSync(publicDir)) {
  console.error(`No build output at ${publicDir}; run npm run build first.`);
  process.exit(1);
}

const failures = [];
function fail(message) {
  failures.push(message);
}

function meta(html, attribute, name) {
  const tag = new RegExp(`<meta\\b[^>]*\\b${attribute}="${name}"[^>]*>`, 'i').exec(html)?.[0];
  return tag && /\bcontent="([^"]*)"/i.exec(tag)?.[1];
}

function link(html, rel) {
  const tag = new RegExp(`<link\\b[^>]*\\brel="${rel}"[^>]*>`, 'i').exec(html)?.[0];
  return tag && /\bhref="([^"]*)"/i.exec(tag)?.[1];
}

function jsonLd(html, label) {
  const blocks = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (match) => match[1],
  );
  if (blocks.length === 0) fail(`${label}: no application/ld+json script`);
  const nodes = [];
  for (const block of blocks) {
    if (block.includes('<')) fail(`${label}: JSON-LD contains an unescaped "<"`);
    let data;
    try {
      data = JSON.parse(block);
    } catch (error) {
      fail(`${label}: JSON-LD does not parse: ${error.message}`);
      continue;
    }
    for (const item of Array.isArray(data) ? data : [data]) {
      if (item['@context'] !== 'https://schema.org') fail(`${label}: JSON-LD @context is ${item['@context']}`);
      nodes.push(...(item['@graph'] ?? [item]));
    }
  }
  return nodes;
}

const types = (nodes) => new Set(nodes.flatMap((node) => [node['@type']].flat()));

function pageHtml(path) {
  return readFileSync(join(publicDir, path, 'index.html'), 'utf8');
}

for (const route of CONTENT_ROUTES) {
  const file = join(publicDir, route, 'index.html');
  const label = `/${route}`;
  if (!existsSync(file)) {
    fail(`${label}: missing from the build output`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const url = canonicalUrl(route);

  if (link(html, 'canonical') !== url) fail(`${label}: canonical is ${link(html, 'canonical')}, expected ${url}`);
  if (meta(html, 'property', 'og:url') !== url) fail(`${label}: og:url is ${meta(html, 'property', 'og:url')}`);
  if (meta(html, 'property', 'og:site_name') !== SITE_NAME) {
    fail(`${label}: og:site_name is ${meta(html, 'property', 'og:site_name')}`);
  }
  if (meta(html, 'property', 'og:image') !== SHARE_IMAGE_URL) {
    fail(`${label}: og:image is ${meta(html, 'property', 'og:image')}`);
  }
  for (const property of ['og:image:width', 'og:image:height']) {
    const value = meta(html, 'property', property);
    if (!/^\d+$/.test(value ?? '') || Number(value) <= 0) fail(`${label}: ${property} is ${value}`);
  }
  if (!meta(html, 'property', 'og:image:alt')) fail(`${label}: og:image:alt missing`);
  if (meta(html, 'name', 'twitter:card') !== 'summary') {
    fail(`${label}: twitter:card is ${meta(html, 'name', 'twitter:card')}`);
  }
  for (const name of ['twitter:site', 'twitter:creator']) {
    if (meta(html, 'name', name) !== TWITTER_HANDLE) fail(`${label}: ${name} is ${meta(html, 'name', name)}`);
  }

  const nodes = jsonLd(html, label);
  const found = types(nodes);
  if (route === '') {
    for (const type of ['WebSite', 'Person']) if (!found.has(type)) fail(`${label}: JSON-LD has no ${type}`);
    if (!found.has('SoftwareApplication') && !found.has('SoftwareSourceCode')) {
      fail(`${label}: JSON-LD has no SoftwareApplication or SoftwareSourceCode`);
    }
  } else {
    const article = nodes.find((node) => [node['@type']].flat().includes('TechArticle'));
    if (!article) {
      fail(`${label}: JSON-LD has no TechArticle`);
    } else {
      const title = /<title[^>]*>([^<]+)<\/title>/.exec(html)?.[1];
      if (article.headline !== title) fail(`${label}: TechArticle headline ${article.headline} is not the page title ${title}`);
      if (article.description !== meta(html, 'name', 'description')) {
        fail(`${label}: TechArticle description is not the page meta description`);
      }
    }
    const breadcrumb = nodes.find((node) => [node['@type']].flat().includes('BreadcrumbList'));
    if (!breadcrumb) {
      fail(`${label}: JSON-LD has no BreadcrumbList`);
    } else {
      const items = breadcrumb.itemListElement ?? [];
      const last = items[items.length - 1];
      const lastUrl = typeof last?.item === 'string' ? last.item : last?.item?.['@id'];
      if (items.length === 0 || lastUrl !== url) fail(`${label}: BreadcrumbList does not end at ${url}`);
    }
  }
}

const evidenceFile = join(publicDir, EVIDENCE_PATH, 'index.html');
if (existsSync(evidenceFile)) {
  const html = readFileSync(evidenceFile, 'utf8');
  if (!/noindex/i.test(meta(html, 'name', 'robots') ?? '')) fail(`/${EVIDENCE_PATH}: redirect page is not noindex`);
  if (link(html, 'canonical') !== canonicalUrl(CASE_STUDY_PATH)) {
    fail(`/${EVIDENCE_PATH}: canonical is ${link(html, 'canonical')}, expected ${canonicalUrl(CASE_STUDY_PATH)}`);
  }
}

const sitemapFile = join(publicDir, 'sitemap.xml');
if (!existsSync(sitemapFile)) {
  fail('sitemap.xml missing from the build output');
} else {
  const sitemap = readFileSync(sitemapFile, 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  for (const route of CONTENT_ROUTES) {
    if (!locs.includes(canonicalUrl(route))) fail(`sitemap.xml misses ${canonicalUrl(route)}`);
  }
  if (locs.some((loc) => loc.includes(EVIDENCE_PATH))) fail('sitemap.xml lists the /evidence/ redirect');
  const extra = locs.filter((loc) => !CONTENT_ROUTES.some((route) => canonicalUrl(route) === loc));
  if (extra.length > 0) fail(`sitemap.xml lists routes outside the content set: ${extra.join(', ')}`);
  if (locs.some((loc) => !loc.startsWith(SITE_URL))) fail(`sitemap.xml has a loc outside ${SITE_URL}`);
}

const shareFile = join(publicDir, 'brand/amaleh-share.png');
if (existsSync(shareFile)) {
  const png = readFileSync(shareFile);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  for (const route of CONTENT_ROUTES) {
    const html = pageHtml(route);
    const declared = [meta(html, 'property', 'og:image:width'), meta(html, 'property', 'og:image:height')];
    if (declared[0] !== String(width) || declared[1] !== String(height)) {
      fail(`/${route}: og:image:width/height ${declared.join('x')} do not match brand/amaleh-share.png ${width}x${height}`);
    }
  }
}

const builtHtml = readdirSync(publicDir, { recursive: true }).filter((name) => name.endsWith('.html'));
if (builtHtml.length === 0) fail('the build output contains no HTML');

if (failures.length > 0) {
  console.error(`SEO verification failed with ${failures.length} problem(s):\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}

console.log(
  `SEO verification passed: ${CONTENT_ROUTES.length} content routes carry canonical, og:url, og:site_name, ` +
    `og:image with width, height and alt, twitter:card summary and ${TWITTER_HANDLE}; the home page carries ` +
    'WebSite, Person and SoftwareSourceCode; every documentation and case-study route carries a TechArticle and a ' +
    'BreadcrumbList ending at its canonical URL; /evidence/ is noindex and canonical to /case-study/; and ' +
    `sitemap.xml lists every content route at ${SITE_URL} and nothing else.`,
);
