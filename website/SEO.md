# Amaleh website search and share metadata

This document is a binding contract for what every route publishes to crawlers
and to share cards. `npm run test:seo` (`website/scripts/check-seo.mjs`) reads
the built output under `website/.output/public/` and fails the build when a
route is missing or wrong on any rule below. It runs in
`.github/workflows/pages.yml` after `npm run test:static`.

## The production address

`SITE_URL` in `website/src/lib/links.ts` is `https://mhamri.github.io/amaleh/`,
the repository's GitHub Pages home. It is written once and never derived from
`import.meta.env.BASE_URL`: a local build with `SITE_BASE=/` must still emit
production canonical, `og:url`, `og:image` and sitemap addresses, because a
crawler must never index a staging origin.

`website/src/lib/seo.ts` builds every absolute address from it:

- `canonicalUrl(path)` joins `SITE_URL` with the route path relative to the
  base, so `canonicalUrl('docs/workflow/')` is
  `https://mhamri.github.io/amaleh/docs/workflow/`.
- `SHARE_IMAGE_URL` is `SITE_URL` plus `brand/amaleh-share.png`.
- `CONTENT_ROUTES` is the ordered list of every indexable route. The sitemap
  and `check-seo.mjs` both read it, so a route cannot be added to one and
  forgotten in the other.

`links.ts` also holds the author's profile URLs — `GITHUB_PROFILE_URL`,
`LINKEDIN_URL` and `X_URL`. Each is written there once and read from there by
both consumers: the home `Person` in `src/lib/seo.ts` and the connection links
in `src/components/landing/Author.tsx`. That landing component is outside this
feature's route work but inside `website/`, so the change is scoped to the
repository path, not to the files the feature was specified against: a second
set of the same three literals in `Author.tsx` could drift from the `Person`
data Google reads, and `sameAs` is only useful while the two agree.

## What each route must carry

Every content route — `/`, `/docs/`, `/docs/getting-started/`,
`/docs/workflow/`, `/docs/review-and-recovery/`, `/docs/commands/` and
`/case-study/` — renders `PageMeta`. It emits, through `@solidjs/meta`:

| Tag | Value |
| --- | --- |
| `<title>` | the route's own title |
| `meta[name=description]` | the route's own description |
| `link[rel=canonical]` | `canonicalUrl(path)` |
| `meta[property=og:title]` | the route title |
| `meta[property=og:description]` | the route description |
| `meta[property=og:type]` | `website` |
| `meta[property=og:url]` | `canonicalUrl(path)` |
| `meta[property=og:site_name]` | `Amaleh` |
| `meta[property=og:image]` | `SHARE_IMAGE_URL` |
| `meta[property=og:image:width]` / `:height` | the share image's real pixels |
| `meta[property=og:image:alt]` | a description of the share image |
| `meta[name=twitter:card]` | `summary` |
| `meta[name=twitter:site]` / `:creator` | `@MHosseinAmri` |

`/evidence/` is a redirect page, not content. It renders `PageMeta` with
`noindex` and `canonicalPath={CASE_STUDY_PATH}`, so it carries
`meta[name=robots]` containing `noindex` and a canonical pointing at
`/case-study/`. It never appears in the sitemap. There is no `robots.txt`:
crawlers ignore one below the domain root, so the noindex tag is the rule that
actually holds.

### The share image

`brand/amaleh-share.png` is a square produced by
`website/scripts/generate-brand-images.mjs`. `PageMeta` declares a 600 by 600
fallback; `website/scripts/postbuild.mjs` reads the PNG's IHDR header and
rewrites `og:image:width` and `og:image:height` on every built page to the
file's real pixels, so the declared size cannot drift from the asset.

## Structured data

`website/src/components/StructuredData.tsx` is the only JSON-LD renderer. It
takes a `Graph` typed with `schema-dts` and serialises it with every `<`
escaped as `\u003c`, so page copy can never close the script element. The
builders live in `website/src/lib/seo.ts`:

- `homeGraph()` returns one `@graph` with a `WebSite` named Amaleh at
  `SITE_URL`, a free `SoftwareSourceCode` whose `codeRepository` is the
  repository (no licence claim, because the repository has no `LICENSE` file),
  and a `Person` for Mohammad Hossein Amri whose `sameAs` lists his GitHub,
  LinkedIn and X profiles from `links.ts`.
- `articleGraph(path, headline, description)` returns a `TechArticle` and a
  `BreadcrumbList` whose last item is `canonicalUrl(path)`.

Only facts already on the site are allowed: no ratings, no prices beyond
`isAccessibleForFree`, no dates and no claims the pages do not make.

### Adding structured data to a new route

1. Add the route path to `CONTENT_ROUTES` in `website/src/lib/seo.ts`.
2. In the route component, name the route's `title` and `description` once as
   constants.
3. Render `<PageMeta path={path} title={title} description={description} />`.
4. For a documentation-style page, pass
   `structuredData={articleGraph(path, title, description)}` so the
   `TechArticle` headline and description are the page's own. Add a new
   builder in `website/src/lib/seo.ts` for any other shape.
5. Run `npm run build` and `npm run test:seo`.

## The sitemap

`npm run build` runs `website/scripts/postbuild.mjs`, which writes
`website/.output/public/sitemap.xml`. It lists every route in `CONTENT_ROUTES`
as an absolute `SITE_URL` address and nothing else — no `/evidence/`, no
`lastmod`, because the site has no measured per-route dates to publish.

The sitemap must be submitted once in Google Search Console for the
`mhamri.github.io/amaleh/` property. It is a one-time action, not part of the
build; after it, Google fetches the sitemap again on its own schedule.
