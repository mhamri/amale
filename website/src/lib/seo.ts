// See website/SEO.md — canonical URL rules and structured data builders.
import type {
  BreadcrumbList,
  Graph,
  ListItem,
  Person,
  SoftwareSourceCode,
  TechArticle,
  WebSite,
} from 'schema-dts';
import { SHARE_IMAGE } from './brand.ts';
import { GITHUB_PROFILE_URL, LINKEDIN_URL, REPOSITORY_URL, SITE_URL, X_URL } from './links.ts';

export const SITE_NAME = 'Amaleh';
export const TWITTER_HANDLE = '@MHosseinAmri';

export const SHARE_IMAGE_URL = `${SITE_URL}${SHARE_IMAGE.publicPath}`;
export const SHARE_IMAGE_ALT = 'The Amaleh logo, glowing on a dark ledger background';

export const HOME_PATH = '';
export const DOCS_PATH = 'docs/';
export const CASE_STUDY_PATH = 'case-study/';
export const EVIDENCE_PATH = 'evidence/';

export type Crumb = { name: string; path: string };

export const HOME_CRUMB: Crumb = { name: 'Home', path: HOME_PATH };
export const DOCS_CRUMB: Crumb = { name: 'Documentation', path: DOCS_PATH };
const SECTION_CRUMBS: readonly Crumb[] = [HOME_CRUMB, DOCS_CRUMB];

export function canonicalUrl(path: string): string {
  return `${SITE_URL}${path.replace(/^\/+/, '')}`;
}

function trailTo(page: Crumb): Crumb[] {
  const own = SECTION_CRUMBS.find((section) => section.path === page.path) ?? page;
  const ancestors = SECTION_CRUMBS.filter((section) => section.path !== page.path && page.path.startsWith(section.path));
  return [...ancestors, own];
}

function breadcrumbs(page: Crumb): BreadcrumbList {
  const itemListElement: ListItem[] = trailTo(page).map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: { '@id': canonicalUrl(crumb.path) },
  }));
  return { '@type': 'BreadcrumbList', itemListElement };
}

const author = (): Person => ({
  '@type': 'Person',
  name: 'Mohammad Hossein Amri',
  url: GITHUB_PROFILE_URL,
  sameAs: [GITHUB_PROFILE_URL, LINKEDIN_URL, X_URL],
});

export function homeGraph(description: string): Graph {
  const website: WebSite = {
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'en',
  };
  const skill: SoftwareSourceCode = {
    '@type': 'SoftwareSourceCode',
    name: SITE_NAME,
    description,
    codeRepository: REPOSITORY_URL,
    isAccessibleForFree: true,
  };
  return { '@context': 'https://schema.org', '@graph': [website, skill, author()] };
}

export function articleGraph(page: { crumb: Crumb; headline: string; description: string }): Graph {
  const article: TechArticle = {
    '@type': 'TechArticle',
    headline: page.headline,
    description: page.description,
    url: canonicalUrl(page.crumb.path),
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    author: author(),
  };
  return { '@context': 'https://schema.org', '@graph': [article, breadcrumbs(page.crumb)] };
}
