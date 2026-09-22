# Amale website design system

This document is a binding contract. Every page — the landing page, the five
documentation pages and the evidence page — is built from the tokens and
component patterns below, using daisyUI components and Tailwind utilities
only. **No page may add global CSS.** The only stylesheet in the site is
`website/src/style.css`; it holds the theme, the base layer and shell chrome
(skip link, footer-title correction, closed-dropdown correction) and nothing
page-specific.

## Aesthetic direction

Amale is a delivery workflow for coding agents: plan, build, review, verify,
resume. The site's visual language is a **night ledger** — a calm, layered
graphite workspace where warm brass marks action, teal marks "verified", and
violet marks orchestration. Depth is deliberate: surfaces step lighter as they
rise, separated by hairline borders and two quiet shadow levels. Motion is
short, ease-out, and explains state changes; it never decorates.

Two earlier directions are **rejected and must not return**:

- a cream paper background (`#f4f3ec`) with a lime accent, mixed serif/sans
  editorial type, magazine layout, and a decorative orbit diagram;
- a plain white background with near-black ink text and a single blue accent.

Also avoid the generic defaults: all-caps eyebrow labels, numbered markers on
content that is not a sequence, tinted near-black pretending to be black,
"WORD — fragment" labels, and arrows appended to link text.

## Palette

The daisyUI theme `amale` (declared in `style.css`, `default: true`,
`color-scheme: dark`) defines every colour. Use the semantic roles; never
introduce a new hex in a page.

| Token | Hex | Role |
| --- | --- | --- |
| `base-100` | `#0f1216` | Page background |
| `base-200` / `raised` | `#161c22` | Card and code-block surfaces |
| `base-300` | `#20272f` | Elevated surfaces (dropdowns, hover fills) |
| `base-content` | `#e8edf3` | Primary text |
| `dim` | `#a3adb9` | Secondary text |
| `line` | `#2b333c` | Hairline borders and dividers |
| `primary` | `#e2a45c` | Brass — primary actions, active states, the mark |
| `primary-content` | `#221505` | Text on primary |
| `secondary` | `#5cc9b4` | Teal — verification, success, "checked" |
| `secondary-content` | `#06231d` | Text on secondary |
| `accent` | `#b7a3f2` | Violet — orchestration highlights (Jev, routing). Sparingly. |
| `accent-content` | `#1c1030` | Text on accent |
| `neutral` | `#262d35` | Chips, badges, inert containers |
| `neutral-content` | `#dfe5eb` | Text on neutral |
| `info` | `#7fc3e8` | Alert info |
| `success` | `#63cfa0` | Alert success |
| `warning` | `#e2a45c` | Alert warning |
| `error` | `#ef8a80` | Alert error |

Measured contrast ratios (WCAG relative luminance, exact from these hex
values — every text pair clears AA at 4.5:1 and most clear AAA at 7:1):

| Foreground | Background | Ratio |
| --- | --- | --- |
| `base-content` `#e8edf3` | `base-100` `#0f1216` | 15.95:1 |
| `base-content` `#e8edf3` | `base-200` `#161c22` | 14.58:1 |
| `base-content` `#e8edf3` | `base-300` `#20272f` | 12.81:1 |
| `dim` `#a3adb9` | `base-100` `#0f1216` | 8.26:1 |
| `dim` `#a3adb9` | `base-200` `#161c22` | 7.55:1 |
| `primary` `#e2a45c` | `base-100` `#0f1216` | 8.67:1 |
| `primary` `#e2a45c` | `base-200` `#161c22` | 7.93:1 |
| `primary-content` `#221505` | `primary` `#e2a45c` | 8.24:1 |
| `secondary` `#5cc9b4` | `base-100` `#0f1216` | 9.36:1 |
| `secondary-content` `#06231d` | `secondary` `#5cc9b4` | 8.27:1 |
| `accent` `#b7a3f2` | `base-100` `#0f1216` | 8.52:1 |
| `accent-content` `#1c1030` | `accent` `#b7a3f2` | 8.18:1 |
| `neutral-content` `#dfe5eb` | `neutral` `#262d35` | 10.96:1 |
| `info` `#7fc3e8` | `base-100`, then on `info-content` `#0a2231` | 9.72:1 / 8.45:1 |
| `success` `#63cfa0` | `base-100`, then on `success-content` `#06251a` | 9.80:1 / 8.52:1 |
| `error` `#ef8a80` | `base-100`, then on `error-content` `#2b0b08` | 7.70:1 / 7.47:1 |

Tinted fills for callouts and soft badges use the component's own soft
variant (e.g. `alert-soft alert-info`); do not hand-mix alpha colours.

## Typography

Two loaded families and the system stack for body text.

- **Display: Bricolage Grotesque Variable** (self-hosted via
  `@fontsource-variable/bricolage-grotesque`, imported in `style.css`) —
  headings and the wordmark. Tight tracking, semibold.
- **Code and data: Spline Sans Mono** (`@fontsource/spline-sans-mono`,
  weights 400/500/600) — code, labels, small data. Labels are sentence case.
- **Body: system sans** (`--font-sans` in `style.css`) — body copy at 1rem,
  `leading-relaxed`. Keep line length under 80 characters (`max-w-prose`).

Type scale (Tailwind utilities, all available now):

| Level | Classes | Size |
| --- | --- | --- |
| Hero `h1` | `font-display text-hero font-semibold tracking-tight` | clamp(2.5rem → 4.25rem) |
| Docs `h1` | `font-display text-display font-semibold tracking-tight` | clamp(1.875rem → 2.625rem) |
| `h2` | `font-display text-display font-semibold tracking-tight` | clamp(1.875rem → 2.625rem) |
| `h3` | `font-display text-title font-semibold tracking-tight` | 1.375rem |
| `h4` / lead-in | `font-sans text-lg font-semibold` | 1.125rem |
| Body | `text-base leading-relaxed` | 1rem |
| Small / meta | `text-sm text-dim` | 0.875rem |
| Label / data | `font-mono text-sm text-dim` (sentence case) | 0.875rem |
| Code | `font-mono text-sm leading-relaxed` | 0.875rem |

One `h1` per page. Landing and evidence pages use Hero `h1` (`text-hero`);
documentation pages use Docs `h1` (`text-display`) for the page title in the
docs header. Heading levels nest in order; do not skip levels. Chrome that
repeats on every route is not a heading at all: the footer's column labels are
`p.footer-title` inside a `nav` whose `aria-label` names the group, so they
cannot break a page's heading order. Do not italicise or recolour a single word
in a headline as emphasis.

## Spacing and layout rhythm

- Base unit 4px. Space between a heading and its body: `mt-3`/`mt-4`.
- **Section wrapper** (every page section, copy verbatim):

  ```html
  <section class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
  ```

  Two adjacent wrappers must not stack their vertical rhythm — 96 pixels of
  bottom padding on 96 more of top padding reads as a hole in the page. The
  seam between two content sections carries one rhythm, never two:

  - The first section on a page uses the verbatim wrapper. When the hero sits
    directly above another section, the hero trims its bottom padding and the
    next section trims its top so the pair pulls together:

    ```html
    <section class="mx-auto w-full max-w-6xl px-4 pb-4 pt-16 sm:px-6 md:pb-8 md:pt-24">
    <section class="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 md:pt-8">
    ```

  - A section that follows one carrying no bottom padding keeps the full
    wrapper: its own top padding is then the entire seam.

  - A page that is one continuous document — the evidence page and every
    documentation page — uses a single wrapper and sets the rhythm between
    blocks inside it (`mt-12` between heading groups, `space-y-12` between
    sections) instead of stacking wrappers.

  A full-bleed tinted band is a page-level boundary, not an adjacent section:
  it wraps `border-y border-line bg-base-200/50` around the verbatim wrapper
  and keeps the full rhythm on both sides.
- Prose blocks: `max-w-prose`. Two-column feature grids:
  `grid gap-6 md:grid-cols-2`. Reading order stays single-column below `md`.
- Footer/header containers: `mx-auto w-full max-w-6xl px-4 sm:px-6`.

## Shape, borders, elevation

- Radius: `rounded-box` (0.875rem) for cards/panels/code blocks,
  `rounded-field` (0.5rem) for buttons, inputs, small chips.
- Every card or panel carries `border border-line bg-base-200` plus
  `shadow-rest`; modals, dropdowns and focused panels use `shadow-raised`.
- Dividers are `border-line` (1px). Never use pure black or pure white.

## Motion

- Durations: 160ms for micro-interactions (hover, colour), 260ms for state
  changes (disclosure, tabs). Ease: `ease-out-soft`
  (`cubic-bezier(0.22, 1, 0.36, 1)` — available as a utility).
- **One orchestrated moment per page**: the hero may use
  `animate-rise` (0.6s fade + 0.75rem rise, `both`). Apply it to the hero
  headline group at most, optionally staggering with
  `[animation-delay:120ms]`. No other page-load or scroll-triggered
  animations; no hover transitions on every card — hover feedback is a
  160ms colour/border change only.
- Motion answers actions: dropdowns, collapses and tabs animate as they
  open; nothing loops continuously except an explicit `loading-spinner`.
- **Reduced motion:** `style.css` kills all transitions, keyframes and
  smooth scrolling under `prefers-reduced-motion: reduce`. Never add motion
  that bypasses it (e.g. Web Animations API or inline `style` transitions).

## Component patterns (copy the class strings)

**Buttons** — daisyUI `btn`, never custom button CSS:

- Primary action: `btn btn-primary font-semibold rounded-field`
- Secondary: `btn btn-outline border-line text-base-content hover:bg-base-200`
- Tertiary/ghost: `btn btn-ghost text-dim hover:text-base-content`
- Compact (nav, tables): add `btn-sm`. Only one primary button per view.

**Links** — body links:
`class="link link-hover text-primary"`. In running copy keep the sentence
tone; no trailing arrows. External links get `target="_blank"
rel="noopener noreferrer"`. All internal hrefs go through `asset()` from
`src/lib/paths.ts`.

**Card**:

```html
<article class="card rounded-box border border-line bg-base-200 shadow-rest">
  <div class="card-body gap-3 p-6">
    <h3 class="font-display text-title font-semibold tracking-tight">…</h3>
    <p class="text-sm leading-relaxed text-dim">…</p>
  </div>
</article>
```

**Code block**:

```html
<figure class="overflow-hidden rounded-box border border-line bg-base-200 shadow-rest">
  <div class="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-xs text-dim">
    <span>npm</span>
  </div>
  <pre class="overflow-x-auto p-4 font-mono text-sm leading-relaxed"><code>npm i …</code></pre>
</figure>
```

**Callout** — daisyUI alert, soft variant matching the semantics
(`alert-soft alert-info|success|warning|error`), with `rounded-box`:

```html
<div class="alert alert-soft alert-success rounded-box border border-line text-sm">
  <span>…</span>
</div>
```

**Table**:

```html
<div class="overflow-x-auto rounded-box border border-line bg-base-200">
  <table class="table table-sm">
    <thead class="font-mono text-xs text-dim">…</thead>
    <tbody class="text-sm">…</tbody>
  </table>
</div>
```

**Lists** — unordered: `list-inside list-disc space-y-2 text-dim` with
`text-base-content` on emphasized spans, inside `max-w-prose`. Ordered
procedures may use `steps steps-vertical` — only for content that truly is a
sequence.

**Badges / chips**: `badge badge-soft badge-primary|secondary|accent
  text-xs` for a tinted chip, `badge badge-primary text-sm` for a filled one.
  Never combine `badge-soft` with `badge-neutral` or any dark hue: daisyUI 5
  renders a soft badge as the badge colour itself over an 8% tint of that
  colour mixed into `base-100`, so `badge-soft badge-neutral` sets `neutral`
  `#262d35` text on `#111418` — **1.33:1**, unreadable on the dark theme. The
  light hues read as text over the same treatment: primary `#e2a45c` on
  `#1d1c1c` **7.85:1**, secondary `#5cc9b4` on `#151e21` **8.45:1**, accent
  `#b7a3f2` on `#1a1c24` **7.72:1**. A neutral chip is the solid
  `badge badge-neutral`: `neutral-content` `#dfe5eb` on `neutral` `#262d35`,
  **10.96:1**.

**On-page navigation (docs layout)** — every docs page uses this shell:

```html
<div class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
  <div class="grid gap-10 lg:grid-cols-[16rem_1fr]">
    <aside class="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <nav aria-label="Documentation">
        <ul class="menu w-full gap-0.5 rounded-box border border-line bg-base-200 p-2 font-mono text-sm">
          <li class="menu-title text-dim">Docs</li>
          <li><a class="text-dim hover:bg-base-300" href={asset('docs/…')}>…</a></li>
          <!-- current page: -->
          <li><a class="bg-base-300 font-medium text-base-content" aria-current="page" href="…">…</a></li>
        </ul>
      </nav>
    </aside>
    <article class="min-w-0 max-w-prose"> … </article>
  </div>
</div>
```

`min-w-0` on both the aside and article is load-bearing: both are children of
`grid lg:grid-cols-[16rem_1fr]`, and a grid item's default `min-width: auto`
lets wide `<pre>` blocks inside push the column open instead of scrolling.
The accessibility floor forbids exactly that outcome — nothing may overflow
horizontally at 320 CSS pixels — and `overflow-x-auto` on wide content alone
is not sufficient here.

**Header pattern** (fixed by this task, in `Header.tsx`): sticky
`bg-base-100/85 backdrop-blur-md border-b border-line`; brand lockup is the
mark plus the wordmark `amale` in `font-display` — the Arabic-script word
عمله never appears in the lockup or any document title; it may appear only
in body copy, always with its pronunciation (AH-mah-lah), its meaning
(workers / laborers) and its **Persian origin** (the word is Persian, not
Arabic). Mobile menu is a daisyUI `dropdown` built on a native
`<details>`/`<summary>`, so it is keyboard operable without JS. One shell-only
correction in `style.css` (`details.dropdown:not([open]) > .dropdown-content {
display: none }`) is required: the absolutely positioned `dropdown-content`
has the positioned `dropdown` as its containing block, so it escapes native
closed-details hiding and would stay painted (and tabbable) while the menu is
closed. Verified in headless Chromium: closed state paints nothing, open state
opens fully inside a 320px viewport (content right edge 293px).

**Icons**: inline SVG (currentColor), `size-4`/`size-5`, `aria-hidden="true"`
when decorative.

## Accessibility floor

- Visible keyboard focus everywhere: the shared `:focus-visible` outline in
  `style.css` (2px `primary`, 2px offset). Do not remove it per element.
- The global skip link (`.skip-link` in `style.css`) must remain the first
  focusable element; every page's `<main id="main">` keeps that id.
- Nothing may overflow horizontally at 320 CSS pixels: wrap any
  intrinsically wide content (`pre`, tables) in `overflow-x-auto`.
- Colour is never the only carrier of meaning; status callouts pair icon or
  label with the colour.

## Build rules for page authors

- Import nothing into `style.css`; no `<style>` blocks, no global CSS files.
- Compose from: daisyUI component classes, Tailwind utilities, and the
  tokens above (`text-dim`, `border-line`, `bg-raised`, `shadow-rest`,
  `shadow-raised`, `ease-out-soft`, `animate-rise`, `text-hero`,
  `text-display`, `text-title`, `font-display`, `font-mono`).
- Prefer a daisyUI component over hand-rolled markup for every standard UI
  element (button, menu, alert, badge, table, collapse, steps, stat, kbd).
- Interactive disclosures use daisyUI `collapse` or native `details` — both
  keyboard reachable; do not build JS-only toggles.

## Verified checks

- `tsc --noEmit` passes; `npm run build` prerenders all routes.
- Rendered inspection (headless Chromium) at 320/390/1440 px over every
  prerendered route: no horizontal overflow, one `h1` per route, visible
  keyboard focus, and reduced motion respected.
