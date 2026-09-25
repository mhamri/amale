# Website dependency verification

Versions below were checked against authoritative release sources on **2026-09-20**. Dependencies are pinned in `package.json`; `package-lock.json` records the resolved installation. CI uses `npm ci`.

| Dependency | Selected stable version | Authoritative source |
| --- | --- | --- |
| SolidStart | 2.0.5 | [npm registry](https://registry.npmjs.org/@solidjs%2fstart/latest) |
| Nitro (compatibility exception) | 3.0.260903-beta | [Registry metadata](https://registry.npmjs.org/nitro/3.0.260903-beta) |
| Solid | 1.9.15 | [npm registry](https://registry.npmjs.org/solid-js/latest) |
| Solid Router | 1.0.0 | [npm registry](https://registry.npmjs.org/@solidjs%2frouter/latest) |
| Solid Meta | 0.29.4 | [npm registry](https://registry.npmjs.org/@solidjs%2fmeta/latest) |
| daisyUI | 5.7.42 | [npm registry](https://registry.npmjs.org/daisyui/latest) |
| Tailwind CSS | 4.3.3 | [npm registry](https://registry.npmjs.org/tailwindcss/latest) |
| Tailwind Vite plugin | 4.3.3 | [npm registry](https://registry.npmjs.org/@tailwindcss%2fvite/latest) |
| Vite | 8.3.0 | [npm registry](https://registry.npmjs.org/vite/latest) |
| TypeScript | 7.0.2 | [npm registry](https://registry.npmjs.org/typescript/latest) |
| Node type definitions | 26.6.2 | [npm registry](https://registry.npmjs.org/@types%2fnode/latest) |
| Bricolage Grotesque (variable font, self-hosted) | 5.3.0 | [npm registry](https://registry.npmjs.org/@fontsource-variable%2fbricolage-grotesque/latest) |
| Spline Sans Mono (self-hosted) | 5.3.0 | [npm registry](https://registry.npmjs.org/@fontsource%2fspline-sans-mono/latest) |
| Node.js | 26.9.0 | [Official distribution index](https://nodejs.org/dist/index.json) |
| GitHub Actions runner | Ubuntu 26.04 | [General availability announcement, September 17, 2026](https://github.blog/changelog/2026-09-17-ubuntu-26-generally-available-and-latest-migration/) |
| actions/checkout | 7.0.1 | [Official release](https://github.com/actions/checkout/releases/tag/v7.0.1) |
| actions/setup-node | 7.0.0 | [Official release](https://github.com/actions/setup-node/releases/tag/v7.0.0) |
| actions/configure-pages | 6.0.0 | [Official release](https://github.com/actions/configure-pages/releases/tag/v6.0.0) |
| actions/upload-pages-artifact | 5.0.0 | [Official release](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0) |
| actions/deploy-pages | 5.0.1 | [Official release](https://github.com/actions/deploy-pages/releases/tag/v5.0.1) |

Nitro is the one prerelease exception. Installing stable Nitro 3.0.0 reproducibly failed with npm ERESOLVE: Nitro requires optional peer Vite ^7, while stable SolidStart 2.0.5 requires Vite ^8 or ^9. The registry's current 3.0.260903-beta adapter is selected to retain stable SolidStart and Vite without forcing incompatible peers. No stable Nitro release satisfies this combination. Revisit the exception when a compatible stable adapter is published.

## Pages CI contract

Pull requests run installation, type checking, the prerendered production build, and static-output checks without deployment permissions. Pushes and manual runs deploy only when targeting the repository's default branch, and only after those checks pass. The artifact is `website/.output/public`.

The workflow derives `SITE_BASE` as `/repository-name/`, or `/` for an `owner.github.io` repository. Set the repository Actions variable `SITE_BASE` to `/` for a custom domain, or to another required absolute path. Enable **Settings → Pages → Source → GitHub Actions** before the first deployment.

## Verification gates

Run `npm ci`, `npm run check`, `npm run build`, and `npm run test:static` from `website`. This document records version selection and the required gates; it does not claim a successful remote CI run or deployment.

## Third-party tracking tags

Two third-party tracking tags load on every page of the Amaleh website. Google Tag Manager container `GTM-T8QCHM2H` injects from the shared HTML shell in `website/src/entry-server.tsx`. The X (Twitter) conversion tracking base code for pixel `rfusf` runs only from a Custom HTML tag inside the GTM container — it never loads directly from the page shell, because loading it in both places would send two page-view events per visit.

**Google Tag Manager.** The HTML shell in `entry-server.tsx` places a Consent Mode defaults script before the GTM head script. The GTM head script loads container `GTM-T8QCHM2H` as the first script in `<head>`, before any stylesheet or module preload. A GTM noscript iframe appears as the first element after the opening `<body>` tag. Both appear exactly once on every prerendered page.

**X (Twitter) conversion tracking.** The X base code for pixel `rfusf` loads the `uwt.js` loader, sets `twq.integration='gtm-ad-manager'`, and calls `twq('config','rfusf')`. This code runs only from GTM container Custom HTML tag 4, never from the page shell. The operator must set tag 4 to require `ad_storage` consent (Advanced Settings → Consent Settings → Require additional consent) so the X pixel fires only after the visitor grants consent.

**Google Consent Mode v2.** The Consent Mode defaults script (in `website/src/entry-server.tsx`, before the GTM head script) sets `ad_storage`, `ad_user_data`, `ad_personalization`, and `analytics_storage` to `denied` for visitors whose IP address indicates the EU/EEA, the UK, or Switzerland, and to `granted` for visitors elsewhere. The exact region list lives in `website/src/lib/consent.ts` as `consentRegions`. Google applies these region-based defaults using the visitor's IP; the page sets them before GTM fires.

**Consent banner and storage.** Visitors whose browser time zone falls within the same region set see a consent banner with equal Accept and Reject buttons. A footer "Cookie settings" control reopens the banner. The visitor's choice is stored in `localStorage` under the key `amaleh-consent` and re-applied before the GTM script runs on subsequent visits. Visitors outside these regions see neither the banner nor the footer link.

**Time-zone vs. IP disagreement.** When the visitor's browser time zone and their IP address disagree, the implementation fails safe: an EU/EEA/UK/Swiss IP with a non-European time zone stays in `denied` with no banner shown.
