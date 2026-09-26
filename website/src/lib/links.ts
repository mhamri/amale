/*
 * The single place the project's outbound links live. Every page that points
 * at the repository or at the sponsor page imports from here so the two URLs
 * are written once and cannot drift apart.
 */

/** The repository the skill, its source and its issues live in. */
export const REPOSITORY_URL = 'https://github.com/mhamri/amaleh';

/** Where a reader can fund the work. */
export const SPONSOR_URL = 'https://github.com/sponsors/mhamri';

// See website/SEO.md — the production origin every canonical, share and sitemap URL is built from.
export const SITE_URL = 'https://mhamri.github.io/amaleh/';

// See website/SEO.md — the author's profiles, shared by the landing page and the home Person data.
export const GITHUB_PROFILE_URL = 'https://github.com/mhamri';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/mhamri/';
export const X_URL = 'https://x.com/MHosseinAmri';
