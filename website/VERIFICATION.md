# Website verification

Observed locally on 2026-09-21 using Node 24.19.0 (additional local compatibility, not the latest release) and the committed package lock. CI targets the separately verified latest stable Node.

- `npm ci --no-audit --no-fund`: installed successfully from the lockfile.
- `npm run check`: TypeScript strict mode passed.
- `npm run build` prerenders seven routes via nitro's link crawler with `failOnError: true`: `/`, `/docs/`, `/evidence/`, `/docs/getting-started/`, `/docs/workflow/`, `/docs/review-and-recovery/` and `/docs/commands/`. Each route renders to complete HTML with a heading and a `<title>`.
- `npm run test:static` passes for both `SITE_BASE=/` and `SITE_BASE=/amale/`. The checker asserts headings, titles, brand (عمله with pronunciation AH-mah-lah and meaning workers / laborers) on index.html, docs/index.html and evidence/index.html only, metadata, unique element ids, link and asset containment within the configured base path, resolvable link targets and anchor targets, a shipped `.nojekyll`, no private or build files in the output, and WCAG AA 4.5:1 contrast for every foreground/background pair declared in the design system. The brand assertion is gated to those three routes because only they carry the name in body copy; the other four routes are checked for headings, titles, metadata, ids, link containment and resolvable targets.
- Headless Chromium render probe over every prerendered route in `website/.output/public` runs clean.

## Routes and verification state

The production build prerenders all seven routes under both `/` and `/amale/`. Both builds were run and verified in this delivery task: `SITE_BASE=/amale/ node ./node_modules/vite/bin/vite.js build` prerendered eight routes (including `/amale/` itself) and `SITE_BASE=/amale/ node scripts/check-static.mjs` reported "Static verification passed: 7 fully rendered routes ... at Pages base /amale/"; the root build (`SITE_BASE` unset) prerenders the seven routes without the `/amale/` prefix and `node scripts/check-static.mjs` reports the same at Pages base `/`. The seven routes are:

| Route | File | Notes |
| --- | --- | --- |
| `/` | `index.html` | Landing page: problem, division of labor, install, continue to docs |
| `/docs/` | `docs/index.html` | Overview: problem, coordinator/worker/reviewer/Jev, routing, host |
| `/docs/getting-started/` | `docs/getting-started/index.html` | Prerequisites, install, credentials, first run |
| `/docs/workflow/` | `docs/workflow/index.html` | Discovery, planning, delegation, parallel execution, verified delivery |
| `/docs/review-and-recovery/` | `docs/review-and-recovery/index.html` | Independent review, coverage, repair escalation, resume, diagnostics |
| `/docs/commands/` | `docs/commands/index.html` | Full CLI operation reference from `amale/references/runtime.md` |
| `/evidence/` | `evidence/index.html` | Primary sources and what has been exercised |

Each route's sidebar and internal links are built through `asset()` from `website/src/lib/paths.ts`, so hrefs carry the configured `SITE_BASE` prefix. `website/vite.config.ts` derives the prerendered route list by crawling links from the home page, not by hand.

The standalone interactive workflow graph ships at the site root as `workflow.html`: `prepare.mjs` reads the repository's `DESIGN.html` and writes it to `public/workflow.html` unchanged — the design shell does not reference `amale/references/` so no link rewrite is needed. It is a static file, not a route: nitro's crawler does not follow `.html` links, so it never enters prerendering, and the render probe's route list (prerendered `index.html` files) does not include it. The workflow documentation page links to it as the standalone interactive workflow graph, and the static checker resolves that link to the shipped file under both base paths.

## Static checks

`website/scripts/check-static.mjs` replaced the v1 checker that asserted the removed first version of the site ("Big intent.", `.mobile-nav` with `#why`/`#workflow` anchors, daisyUI `collapse-title` disclosure, and `.terminal-header`/`.footer-bottom` rules in a cream palette that `website/src/style.css` no longer declares). The current checker asserts the site that exists and retains no assertion from the removed version.

Contrast checks read the `--token: #hex` variables from `website/src/style.css` and compute WCAG relative-luminance ratios for a fixed set of foreground/background pairs drawn from the design system's table; the pairs that require derived surfaces (badge and alert content fills) are documented with measured ratios in `DESIGN-SYSTEM.md` instead. The minimum documented ratio (error-content on error) is 7.47:1; all pairs clear the 4.5:1 AA floor with margin.

`npm run build` is followed by a `postbuild` step (`website/scripts/postbuild.mjs`) that removes Vite's chunk manifest directory (`.vite/`) from the published output — nothing in the prerendered HTML references it. The checker's output-sanity pass rejects `.vite` alongside the other private and build paths, so its reappearance fails `npm run test:static`.

## Rendered inspection

Rendered desktop and mobile inspection shows no horizontal overflow at 320 and 390 CSS pixels; the header and footer use the shared shell classes and stay inside the viewport. Reduced-motion is respected via the global `@media (prefers-reduced-motion: reduce)` rule in `style.css`. Interactive controls (header dropdown, docs sidebar, on-page table of contents) are keyboard reachable.

## CI and deployment

`.github/workflows/pages.yml` installs the lockfile, type-checks, builds for the configured `SITE_BASE`, and runs `check-static.mjs` on pull requests. Pushes or manual runs on the default branch also upload the rendered site and deploy it to GitHub Pages. The production build must be the last step before verification, because the render probe and the static check both read the build and never run it.

Remote GitHub Actions and public deployment have not been executed in this checkout. Pages must be enabled with GitHub Actions as its source, then the change merged to the default branch. No live-deployment success is claimed.

## Scope

Changes are limited to `website/`, `.github/workflows/pages.yml`, root `README.md` and ignore rules. The Amale skill runtime under `amale/` is unchanged. Primary marketing evidence comes from the shipped `amale/references/` files. The public build copies only the explicit source list declared in `website/scripts/prepare.mjs`.

Consumers: website visitors, JS-disabled readers (the initial HTML contains content), assistive technology, GitHub project/root hosting, and maintainers running a clean install. Paths: home/evidence direct entry, source downloads, documentation navigation, clipboard operations, disclosure open/close, build failure, PR validation, default-branch deployment and nondefault-branch rejection. Website preview is a local allowlisted-root server. CI uses separate build/deploy jobs; only deploy holds Pages/OIDC permissions.
