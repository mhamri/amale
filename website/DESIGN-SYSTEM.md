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
rise, separated by hairline borders and two quiet shadow levels.

The site carries one deliberate visual layer on top of that calm base: a
live hero canvas and a set of orchestration diagrams that show delegation
happening rather than describing it in prose. Those visuals are the site's
confident moment. Everything else stays quiet, so they read as instruments
on a dark console, never as decoration — see **Visualization layer** below
for what is allowed and what is required of each one.

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

| Level | Classes | Size | Line height |
| --- | --- | --- | --- |
| Hero `h1` | `font-display text-hero font-semibold tracking-tight` | clamp(2.5rem → 4.25rem) | 1.05 |
| Docs `h1` | `font-display text-display font-semibold tracking-tight` | clamp(1.875rem → 2.625rem) | 1.15 |
| `h2` | `font-display text-display font-semibold tracking-tight` | clamp(1.875rem → 2.625rem) | 1.15 |
| `h3` | `font-display text-title font-semibold tracking-tight` | 1.375rem | 1.3 |
| `h4` / lead-in | `font-sans text-lg font-semibold` | 1.125rem | Tailwind default |
| Body | `text-base leading-relaxed` | 1rem | 1.625 |
| Small / meta | `text-sm text-dim` | 0.875rem | Tailwind default |
| Label / data | `font-mono text-sm text-dim` (sentence case) | 0.875rem | Tailwind default |
| Code | `font-mono text-sm leading-relaxed` | 0.875rem | 1.625 |

The display line heights live on the tokens themselves
(`--text-hero--line-height`, `--text-display--line-height`,
`--text-title--line-height` in `style.css`), so every heading gets them from
its size class. Without them Tailwind sets 1.5, which spreads a wrapped
headline into separate lines.

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
  <section class="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24">
  ```

  Two adjacent wrappers must not stack their vertical rhythm — 96 pixels of
  bottom padding on 96 more of top padding reads as a hole in the page. The
  seam between two content sections carries one rhythm, never two:

  - The first section on a page uses the verbatim wrapper. When the hero sits
    directly above another section, the hero trims its bottom padding and the
    next section trims its top so the pair pulls together:

    ```html
    <section class="mx-auto w-full max-w-7xl px-4 pb-4 pt-16 sm:px-6 md:pb-8 md:pt-24">
    <section class="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 md:pt-8">
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
- Footer/header containers: `mx-auto w-full max-w-7xl px-4 sm:px-6`.

## Responsive scale

The site is read on a phone, on a tablet and on a desktop monitor, and it
must look deliberate on all three. The failure to design against is a single
`max-w-prose` column parked on the left of a 1440-pixel window with two
thirds of the screen empty — a tablet page stretched onto a desktop. A
desktop layout earns the extra width by putting something in it, never by
stretching body copy past a readable measure.

Four widths are the contract. Every page is checked at all four.

| Width | Target | What must be true |
| --- | --- | --- |
| 320–389 px | Small phone | One column. Nothing overflows horizontally. Diagrams switch to their stacked form. |
| 390–767 px | Phone | One column. Cards full width. The hero scene is its own band under the copy, zoomed onto the model tiles. |
| 768–1023 px | Tablet | Two-column card grids (`md:grid-cols-2`). Docs sidebar still stacked above the article. |
| 1024 px and up | Desktop | The prose column is paired with a second column of real content. Docs use the three-column shell. Card grids reach three columns at `xl`. |

Rules that produce that:

- **Container:** `mx-auto w-full max-w-7xl px-4 sm:px-6` (80rem / 1280 px) for
  every section wrapper and for header and footer. Content inside may be
  narrower; the container is not.
- **Reading measure never grows.** Body copy stays `max-w-prose`
  (about 65 characters) at every width. Width is spent on a second column,
  not on longer lines.
- **Paired section:** a section whose prose has a visual, diagram or panel
  partner uses

  ```html
  <div class="grid items-start gap-10 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:gap-14">
  ```

  so the prose keeps its measure on the left and the visual takes the rest of
  the width. Below `lg` the pair stacks, prose first.
- **Card grids:** `grid gap-6 md:grid-cols-2` is the default, and it is the
  ceiling for any card carrying a paragraph. Four paragraph cards in one row
  give each about 200 pixels of text width inside the documentation shell,
  which wraps every card to a narrow ragged tower and is harder to read than
  two roomy columns. Go past two columns only for cards that hold a label and
  a number, never a sentence. A four-item set of role cards is
  `grid gap-6 md:grid-cols-2`. Reading order stays single column below `md`.
- **Docs shell:** three columns from `xl`, two from `lg`, stacked below —
  navigation, article, and the "On this page" list moved out of the article
  into its own right rail:

  ```html
  <div class="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_14rem]">
  ```

  `minmax(0,1fr)` on the article column is load-bearing for the same reason
  `min-w-0` is: a grid item defaults to `min-width: auto`, so a wide `<pre>`
  or a diagram would push the column open instead of scrolling. The right
  rail is `hidden xl:block` and is the only copy of the on-page list at that
  width; below `xl` the list renders inside the article as before, so the
  page never shows it twice.
- **Full-bleed visuals** may break the prose measure but never the container:
  a diagram panel spans its grid column and stays inside `max-w-7xl`.
- **Type** is already fluid (`text-hero`, `text-display` use `clamp`); do not
  add width-conditional font-size utilities on top of them.

## Landing page structure

The landing page is one ordered narrative. The order is fixed — a reader must
meet the offer, the reasons, the proof, the author and the close in that
sequence — and `src/routes/index.tsx` renders `<main id="main">` with exactly
these sections, in this order, one component each:

| # | Section | Component | id |
| --- | --- | --- | --- |
| 1 | Hero | `landing/Problem.tsx` | — (first `<section>` of `main`) |
| 2 | Benefits | `landing/Benefits.tsx` | `benefits` |
| 3 | Division / model topology | `landing/Division.tsx` | — |
| 4 | Install | `landing/Install.tsx` | — |
| 5 | Author credibility | `landing/Author.tsx` | `author` |
| 6 | Continue | `landing/Continue.tsx` | — |
| 7 | Final call to action | `landing/FinalCall.tsx` | `final-cta` |

The final call to action is always the **last** `<section>` of `main`: it
repeats the offer and the one action, and nothing follows it but the footer.
Where a section carries a fragment id it is the section element's own `id`, so
an in-page link lands on the whole band.

**The hero rule.** The hero carries exactly four things over the full-bleed
scene, and nothing else:

1. one `<h1>` of at most 12 words that states the benefit the reader gets —
   never a statistic, a price or a token count;
2. one short description paragraph, at most 45 words in total across every
   `<p>` in the hero, saying what the reader gets;
3. one primary call to action, `btn btn-primary`, pointing at the getting
   started documentation page through `asset()`;
4. one `Sponsor` button pointing at `SPONSOR_URL` from `src/lib/links.ts`.

Measured rebuild figures, the pronunciation and origin of the name, and every
explanation of the scene belong to the benefits and author sections, not to the
hero. The scene is never covered by the copy: **at 1024 CSS pixels and wider no
headline, paragraph or button may overlap any model tile.** The copy therefore
sits in one compact block on the left (about a third of the band) and every
labelled model tile in the scene stays right of the prose measure. **Below
1024 CSS pixels the scene leaves the background** and becomes its own band
under the buttons — 8:9 on a phone, 16:10 from `sm` — zoomed onto the model
tiles so they read at phone width. Model name
labels under a tile are supporting label copy: below body scale, and in the
sans stack, because a model name is a topic rather than a string a reader could
type or search.

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
- **Entrance motion stays one moment per page**: the hero headline group may
  use `animate-rise` (0.6s fade + 0.75rem rise, `both`), optionally
  staggered with `[animation-delay:120ms]`. No other page-load fade-ins, and
  no hover transitions on every card — hover feedback is a 160ms
  colour/border change only.
- Motion answers actions: dropdowns, collapses and tabs animate as they
  open.
- **Continuous motion is permitted only inside the visualization layer** —
  the hero canvas and the orchestration diagrams described below. It is the
  subject of those components, not decoration on top of them, and it obeys
  the pause rules in that section. Nothing else loops except an explicit
  `loading-spinner`.
- **Reduced motion:** `style.css` kills all transitions, keyframes and
  smooth scrolling under `prefers-reduced-motion: reduce`. CSS-driven motion
  is therefore covered automatically. Script-driven motion is not: every
  canvas or JavaScript timeline must query
  `matchMedia('(prefers-reduced-motion: reduce)')` itself, render one static
  frame when it matches, and subscribe to that query's `change` event so a
  visitor who turns the preference on mid-visit stops the motion.

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

**Badges / chips** — a chip always carries a hue that means something. The
  solid `badge badge-neutral` is graphite on graphite: it clears contrast for
  its own text but reads as an unpainted placeholder against a `base-200`
  card, so it is **retired from content**. It survives only inside `base-100`
  page chrome where no card sits behind it.

  Use the soft variant with a light hue, chosen by what the chip labels:

  | Chip means | Classes |
  | --- | --- |
  | An action, a step number in a sequence, the coordinator, a primary topic | `badge badge-soft badge-primary` |
  | Verified, checked, passing, a count of passing tests or checks, a setting that is in force, a worker that delivered | `badge badge-soft badge-secondary` |
  | Orchestration: Jev, routing, model families, escalation | `badge badge-soft badge-accent` |
  | A source file, a CLI operation name, a reference pointer | `badge badge-soft badge-info font-mono font-normal` |
  | A limit, a caveat, work not yet exercised | `badge badge-soft badge-warning` |

  When two rows could both apply, the more specific meaning wins, and
  "verified" is more specific than "a number". A chip reading
  `83 + 95 tests` labels tests that passed, so it is secondary, not primary;
  `Strict mode` labels a setting that is in force, so it is secondary too.
  Primary is for a step's position in a sequence (`3`, `Step 3`) and for the
  page's own subject, not for any number that happens to be a count.

  Add `text-xs` for chips inside a card heading row and `text-sm` for chips
  used as a standalone list of topics. A filled `badge badge-primary text-sm`
  stays available for a single emphatic chip, at most one group per page.

  **A chip must read as a chip.** daisyUI's soft fill is only an 8% tint, so on
  a `base-200` card the chip body is nearly the card colour and the chip looks
  like coloured text. Every soft chip therefore carries a hairline edge in its
  own hue, added once in the component layer of `style.css` rather than per
  page, so no page can ship a chip without it.

  **Monospace is a meaning, not a decoration.** `font-mono` marks a string the
  reader could type or search: a file path, a CLI operation name, an
  environment variable. A chip naming a topic, a count or a status is body
  text and stays in the sans stack. Two chip groups on the same page must not
  differ in typeface unless they differ in that meaning.

  **A chip attached to a heading pins to the top right.** In a card whose
  heading can wrap, the heading and its chip sit in a
  `flex items-start justify-between gap-3` row with `shrink-0` on the chip, so
  the chip holds the top-right corner instead of drifting down beside the
  second line of a wrapped heading.

  **A run of source chips gets its own line.** File and operation chips that
  cite where a section comes from never share a line with the heading they
  follow; they sit in a `mt-3 flex flex-wrap gap-2` row beneath it, so one
  citation and four citations look the same.

  Never combine `badge-soft` with `badge-neutral` or any dark hue: daisyUI 5
  renders a soft badge as the badge colour itself over an 8% tint of that
  colour mixed into `base-100`, so `badge-soft badge-neutral` sets `neutral`
  `#262d35` text on `#111418` — **1.33:1**, unreadable on the dark theme. The
  light hues read as text over the same treatment and all clear AAA:

  - primary `#e2a45c` on `#1d1c1c` **7.85:1**
  - secondary `#5cc9b4` on `#151e21` **8.45:1**
  - accent `#b7a3f2` on `#1a1c24` **7.72:1**
  - info `#7fc3e8` on `#171e24` **8.72:1**
  - warning `#e2a45c` on `#1d1c1c` **7.85:1**
  - success `#63cfa0` on `#161e1f` **8.84:1**
  - error `#ef8a80` on `#1e1b1e` **7.00:1**

  `scripts/check-static.mjs` derives each fill by reproducing daisyUI's
  `color-mix(in oklab, <colour> 8%, base-100)` in sRGB, measures the WCAG
  ratio, and fails the build both when a ratio drops below 4.5:1 and when the
  hue or ratio above stops matching what it computes. The list is therefore
  enforced rather than hand-maintained: editing the palette without editing
  these lines fails, and editing these lines without the palette fails too.

**On-page navigation (docs layout)** — every docs page uses this shell:

```html
<div class="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24">
  <div class="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_14rem]">
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
    <article class="min-w-0"> … </article>
    <aside class="hidden min-w-0 xl:sticky xl:top-24 xl:block xl:self-start">
      <nav aria-label="On this page"> … </nav>
    </aside>
  </div>
</div>
```

`min-w-0` on every grid child, and `minmax(0,1fr)` on the article column, are
load-bearing: a grid item's default `min-width: auto` lets a wide `<pre>` or a
diagram inside push the column open instead of scrolling. The accessibility
floor forbids exactly that outcome — nothing may overflow horizontally at 320
CSS pixels — and `overflow-x-auto` on wide content alone is not sufficient
here.

Inside the article, running copy stays `max-w-prose`, applied to the prose
blocks rather than to the `<article>`: a diagram panel, table or code block
uses the full article column. The "On this page" list lives in the right rail
from `xl` and inside the article below it, rendered once at any given width.

## Visualization layer

The site shows delegation instead of only describing it. Two component kinds
carry that, and both are subject to the rules here.

**Hero canvas** — one per site, on the landing page only. A WebGL scene whose
subject is the workflow itself: Claude Code or Codex running the coordinator,
the coordinator handing chunks to the four Flash workers (DeepSeek, GLM, MiMo,
Solar), workers asking Jev bounded questions, another Flash family reviewing
each chunk, a chunk that keeps failing repair escalating to Kimi, and accepted
chunks travelling back. The scene must match what the skill does: Anthropic
and OpenAI are the coordinator hosts, never the reviewers. It reads as an instrument on the night-ledger console, drawn
in palette hues (brass for the coordinator and action, teal for accepted or
verified, violet for orchestration and routing) on the `base-100` background.
No photographic texture, no lens flare, no particle confetti.

The hero canvas is a **full-bleed background**, not a panel beside the copy.
It spans the whole hero band edge to edge, sits behind the headline at low
enough contrast that the type stays at its documented ratios, and carries no
`figcaption` — a caption under a background is a panel again. Whatever the
scene needs explaining goes in body copy further down the page, next to the
thing it explains.

Each model node wears a **logo tile**: a rounded square carrying the vendor's
real mark when `website/public/models/` holds one, and otherwise a monogram
in that model's routed hue. The tile is the same size and shape either way, so
a missing logo reads as a deliberate mark rather than a hole. The shipped
mechanism reads the model's `logo` field in `website/src/lib/models.ts`, not
the directory listing: a mark appears only when the file is in that folder
**and** the field points at it, so adding a file alone upgrades nothing. A
mark drawn in `currentColor` — MiMo's and OpenAI's — resolves to black inside
an `<image>`, so its identity entry also sets a light `tileFill`; that is a
tile surface, not a recolouring of the mark. Logos are third-party marks used
to name the models Amale routes to; they are not redrawn, recoloured or
combined with the Amale mark.

**Orchestration and topic diagrams** — SVG plus a small script timeline. Each
one has a single subject named in its own caption: the model topology on the
landing page and the documentation overview, and one diagram per remaining
documentation page showing that page's subject (the run lifecycle, the review
and repair loop, the install and first-run sequence, the operation map).

Required of every visual in this layer, without exception:

- **Server-rendered fallback first.** The component's markup renders complete
  and meaningful with no JavaScript: a static SVG, or a labelled panel that
  states what the visual would show. Canvas and timeline code runs only after
  mount, inside `onMount`, never during server rendering.
- **No-WebGL fallback.** If `getContext('webgl2')` and `getContext('webgl')`
  both return null, the static fallback stays on screen and nothing throws.
- **Reduced motion.** `matchMedia('(prefers-reduced-motion: reduce)')`
  matching means one static frame and no animation loop, with a `change`
  listener so toggling the preference takes effect immediately.
- **Off-screen and hidden pause.** An `IntersectionObserver` stops the loop
  when the visual scrolls out of view, and a `visibilitychange` listener stops
  it when the tab is hidden. A loop must never run unseen.
- **Teardown.** `onCleanup` cancels the animation frame, disconnects the
  observer, removes every listener, and releases WebGL resources.
- **Every label sits inside the shape it labels.** A label belonging to a box
  must fall entirely within that box's rectangle, not merely within the
  `viewBox`. A label that straddles a card edge reads as cut off even though
  the SVG never overflows, and neither the type check nor the static check can
  see it. Labels that belong to a connector rather than a box sit clear of
  every box. Measured with `getBBox` against each `rect` at 320, 768 and 1440
  CSS pixels, the count of labels straddling a card edge must be zero.
- **Accessible.** A decorative canvas is `aria-hidden="true"` and the meaning
  is carried by adjacent text. A diagram that carries meaning is
  `role="img"` with an `aria-label` naming what it shows, or it exposes the
  same structure as real text beside it. Labels inside a diagram are real
  `<text>` in the SVG, so they are selectable and scale with the page.
- **Sized in the layout, not by the window.** The wrapper sets an explicit
  aspect ratio (`aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9]`), the canvas
  fills it with `size-full`, and the drawing buffer is set from
  `getBoundingClientRect()` times `devicePixelRatio`, capped at 2, on mount
  and on resize. Nothing reads `window.innerWidth` to decide a layout.
- **Cheap.** Target 60 frames per second on integrated graphics: no more than
  a few hundred draw calls per frame, no per-frame allocation, no shader
  recompilation after mount.

Diagram panel wrapper, for any visual in this layer:

```html
<figure class="overflow-hidden rounded-box border border-line bg-base-200 shadow-rest">
  <div class="aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[16/9]"> … </div>
  <figcaption class="border-t border-line px-4 py-3 text-sm text-dim">…</figcaption>
</figure>
```

**Header pattern** (fixed by this task, in `Header.tsx`): sticky
`bg-base-100/85 backdrop-blur-md border-b border-line`; brand lockup is the
mark plus the wordmark `amale` in `font-display` — the Arabic-script word
عمله never appears in the lockup or any document title; it may appear only
in body copy, always with its pronunciation (Ah-mah-leh), its meaning
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
- Rendered inspection (headless Chromium) at 320/390/768/1024/1440 px over
  every prerendered route: no horizontal overflow, one `h1` per route,
  visible keyboard focus, reduced motion respected, and at 1024 px and above
  no page reduced to a single narrow column.
- Every visual in the visualization layer is inspected with JavaScript
  disabled (the server-rendered fallback must be meaningful), with WebGL
  unavailable, and with `prefers-reduced-motion: reduce` forced.
