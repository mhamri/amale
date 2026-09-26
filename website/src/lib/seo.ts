// See website/SEO.md — the route list, canonical URL rules and structured data builders.
import type {
  BreadcrumbList,
  Graph,
  ListItem,
  Person,
  SoftwareSourceCode,
  TechArticle,
  WebSite,
} from 'schema-dts';
import { GITHUB_PROFILE_URL, LINKEDIN_URL, REPOSITORY_URL, SITE_URL, X_URL } from './links.ts';

export const SITE_NAME = 'Amaleh';
export const TWITTER_HANDLE = '@MHosseinAmri';

export const SHARE_IMAGE_PATH = 'brand/amaleh-share.png';
export const SHARE_IMAGE_URL = `${SITE_URL}${SHARE_IMAGE_PATH}`;
export const SHARE_IMAGE_ALT = 'The Amaleh logo, glowing on a dark ledger background';
// postbuild.mjs rewrites these to the master's real pixels once the share image exists.
export const SHARE_IMAGE_WIDTH_FALLBACK = 600;
export const SHARE_IMAGE_HEIGHT_FALLBACK = 600;

export const HOME_PATH = '';
export const DOCS_PATH = 'docs/';
export const CASE_STUDY_PATH = 'case-study/';
export const EVIDENCE_PATH = 'evidence/';

export const CONTENT_ROUTES = [
  HOME_PATH,
  DOCS_PATH,
  'docs/getting-started/',
  'docs/workflow/',
  'docs/review-and-recovery/',
  'docs/commands/',
  CASE_STUDY_PATH,
] as const;

export function canonicalUrl(path: string): string {
  return `${SITE_URL}${path.replace(/^\/+/, '')}`;
}

const crumb = (position: number, name: string, url: string): ListItem => ({
  '@type': 'ListItem',
  position,
  name,
  item: { '@id': url },
});

function breadcrumbsFor(path: string, currentName: string): BreadcrumbList {
  const itemListElement =
    path === CASE_STUDY_PATH
      ? [crumb(1, 'Home', SITE_URL), crumb(2, currentName, canonicalUrl(path))]
      : path === DOCS_PATH
        ? [crumb(1, 'Home', SITE_URL), crumb(2, currentName, canonicalUrl(path))]
        : [
            crumb(1, 'Home', SITE_URL),
            crumb(2, 'Documentation', canonicalUrl(DOCS_PATH)),
            crumb(3, currentName, canonicalUrl(path)),
          ];
  return { '@type': 'BreadcrumbList', itemListElement };
}

const author = (): Person => ({
  '@type': 'Person',
  name: 'Mohammad Hossein Amri',
  url: GITHUB_PROFILE_URL,
  sameAs: [GITHUB_PROFILE_URL, LINKEDIN_URL, X_URL],
});

export function homeGraph(): Graph {
  const website: WebSite = {
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'en',
  };
  const skill: SoftwareSourceCode = {
    '@type': 'SoftwareSourceCode',
    name: SITE_NAME,
    description:
      'Amaleh is a self-contained workflow skill for Codex and Claude. It plans, delegates implementation to cheap Flash models, reviews independently and verifies delivery, then resumes from disk.',
    codeRepository: REPOSITORY_URL,
    isAccessibleForFree: true,
  };
  return { '@context': 'https://schema.org', '@graph': [website, skill, author()] };
}

export function articleGraph(path: string, headline: string, description: string): Graph {
  const article: TechArticle = {
    '@type': 'TechArticle',
    headline,
    description,
    url: canonicalUrl(path),
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    author: author(),
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [article, breadcrumbsFor(path, headline.split(' — ')[0])],
  };
}
