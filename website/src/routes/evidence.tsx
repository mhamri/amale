import { For } from 'solid-js';
import PageMeta from '../components/PageMeta';
import { asset } from '../lib/paths';

const glance = [
  {
    label: 'Live routing decision',
    body: 'A real OpenRouter Jev decisions request succeeded using pi\u2019s existing credential \u2014 the adapter sends Jev requests to the decisions endpoint, not chat completions.',
  },
  {
    label: 'Live delegated chunk',
    body: 'An isolated billing fixture traversed Jev routing, Flash implementation, an independent other-family read-only review, exact amount tests, and acceptance, integration and completion.',
  },
  {
    label: 'Offline suite',
    body: 'Latest development check: 83 Bun tests and 95 Node tests (including nested cases) passed.',
  },
  {
    label: 'Site build',
    body: 'Seven routes prerender with complete HTML, and the static checker passes under both SITE_BASE values.',
  },
];

const exercised = [
  {
    title: 'Live checks',
    chip: 'Verified live',
    body: 'The live billing fixture corrected multiplication of unit price by quantity and traversed Jev routing \u2192 deepseek/deepseek-v4.1-flash implementation \u2192 z-ai/glm-5.3-flash independent read-only review \u2192 exact amount tests \u2192 acceptance, integration, completion. No separate TypeSafe key was required.',
  },
  {
    title: 'Behavioral tests',
    chip: '83 + 95 tests',
    body: 'Cover valid completion, graph validation, stale and failed checks, independent review, repair escalation, concurrent checkpointing, dependency-ready progress, conflicting workspaces, live and dead ownership, decision uncertainty, artifact retention, HTML escaping, installation reruns, completed-run resume, upstream invalidation, cross-host takeover and contract amendment. The offline suite spans routing, lifecycle recovery, parallel ownership, review coverage, context isolation and startup preflight.',
  },
  {
    title: 'Static checking',
    chip: 'Strict mode',
    body: 'TypeScript strict mode passes and the skill-creator validator passes. The host-effort escalation path carries seven behavioral tests of its own (baseline \u2192 supported higher effort \u2192 baseline).',
  },
  {
    title: 'Launchers',
    chip: 'Bun and Node',
    body: 'Bun-first launching and the Node fallback were both exercised, including an empty PATH that makes Bun unavailable. The installer reruns cleanly and links the canonical skill directory into Claude and Codex with no external skill dependencies and no npm runtime dependencies.',
  },
];

const untested = [
  {
    title: 'macOS and Linux',
    body: 'Windows was exercised; macOS and Linux paths use portable APIs but have not been run here, because verification ran on a Windows host only.',
  },
  {
    title: 'Remote CI and deployment',
    body: 'Remote GitHub Actions and public deployment have not been executed in this checkout. Pages must be enabled with GitHub Actions as its source before the first deployment; no live-deployment success is claimed.',
  },
  {
    title: 'Model quality, speed and cost',
    body: 'A live fixture demonstrates a working path; it does not establish general model quality, speed or cost. The live smoke test is a historical development observation, not an offline-suite requirement or a benchmark.',
  },
  {
    title: 'Distributed raw artifacts',
    body: 'Raw development artifacts and review reports are not distributed. Acceptance descriptions and host integration receipts are trusted agent attestations; code verifies registered checks and freshness while the host and Jev inspect semantic claim support.',
  },
];

const siteDeps = [
  ['SolidStart', '2.0.5'],
  ['Nitro', '3.0.260903-beta'],
  ['Solid', '1.9.15'],
  ['daisyUI', '5.7.42'],
  ['Tailwind CSS', '4.3.3'],
  ['Vite', '8.3.0'],
  ['TypeScript', '7.0.2'],
  ['Node.js', '26.9.0'],
];

const sources = [
  {
    file: 'planning',
    title: 'Planning',
    body: 'Discovery, specification and planning before any delegation: Jev selects proceed, research, focused grilling or brainstorming from an actual gap; larger work is synthesized into an HTML specification with acceptance criteria; tasks carry binding skills and reference files that the runtime inlines into the worker\u2019s prompt at launch; and a single task carrying three or more run outcomes is refused by plan unless singleChunk records why the work cannot be divided.',
  },
  {
    file: 'execution',
    title: 'Execution and routing',
    body: 'How chunks are routed and run: catalog-driven model eligibility, deterministic round-robin rotation seeded by the run\u2019s session hash, isolated task workspaces, the network launch boundary with its startup preflight, worker context assembly, and the host-exception grants that are the only path to direct coordinator implementation.',
  },
  {
    file: 'review',
    title: 'Review',
    body: 'Fresh cross-model review: the writer\u2019s family never reviews its own work and the author\u2019s proposed verdict is withheld. Every review returns a coverage ledger with one entry per obligation, findings need a reachable scenario and evidence, and repair escalates Flash \u2192 Kimi \u2192 host through a persistent counter that no rename or restart resets.',
  },
  {
    file: 'runtime',
    title: 'Runtime',
    body: 'The command contract: every CLI operation with its input shape \u2014 start, plan, amend, delegate and delegate-batch, claim, check, reviewer and review, finish, diagnose \u2014 plus authentication and process settings, the review coverage contract, startup network preflight, host-action records and the diagnostic export allowlist.',
  },
  {
    file: 'parallelism',
    title: 'Parallelism',
    body: 'Parallel execution without a phase barrier: delegate-batch drives every ready chunk through a pool bounded by maxWorkers, each task needs its own isolated checkout, next.parallel exposes ready candidates, per-task actions and conflict-free independent batches, and durable activity leases reject duplicate verification and conflicting workspace access.',
  },
  {
    file: 'recovery',
    title: 'Recovery',
    body: 'Durable resume and context: run revisions and immutable artifacts live under the workspace\u2019s .amale directory, resume checks worker process liveness and accepted workspace fingerprints, interrupted work becomes blocked for reconciliation rather than ready, and checkpoints are explicit material transitions \u2014 no native Claude/Codex hooks are installed.',
  },
  {
    file: 'verification',
    title: 'Verification',
    body: 'The implementation verification record dated 2026-09-19: the live checks summarized on this page, verified dependency and runtime sources, the practical limits of what the record can claim, and the exact commands that reproduce the offline suite.',
  },
  {
    file: 'effort',
    title: 'Effort escalation',
    body: 'Conditional same-model effort escalation: a Jev decision raises the host above its baseline for a bounded architecture, diagnosis or final-review pass, applied through a supported session mechanism or a same-model pass \u2014 recorded with effort-start and effort-finish, reconciled when interrupted, and always separate from Flash \u2192 Kimi model escalation.',
  },
];

export default function EvidencePage() {
  return (
    <>
      <PageMeta
        title="Evidence — Amale"
        description="What has actually been exercised, what has not and why, the dependency and verification position, and the primary sources shipped with Amale."
      />
      <main id="main">
        <section class="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <div class="grid items-start gap-10 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:gap-14">
            <div class="min-w-0">
              <h1 class="font-display text-hero font-semibold tracking-tight">Evidence</h1>
              <p class="mt-5 text-lg leading-relaxed text-dim max-w-prose">
                Amale is built from documents that travel with the skill. This page is the record
                behind them: what the verification work actually exercised, what it deliberately
                does not claim, and where every claim on this site can be checked in a source you
                can read in full.
              </p>
              <p class="mt-4 text-base leading-relaxed text-dim max-w-prose">
                The project's name is <span lang="fa" dir="rtl">عمله</span>, transliterated as{' '}
                <em>ʿamalah</em> <span class="font-mono text-sm text-dim">/ AH-mah-lah /</span>. It
                is a Persian word meaning <strong>workers / laborers</strong> — people contributing
                effort to a shared result. <em>Amale</em> is the project's Latin-script name.
              </p>
            </div>
            <aside class="min-w-0 card rounded-box border border-line bg-base-200 shadow-rest">
              <div class="card-body gap-4 p-6">
                <p class="font-mono text-sm text-dim">The record at a glance</p>
                <ul class="space-y-4">
                  <For each={glance}>
                    {(item) => (
                      <li class="border-t border-line pt-4 first:border-t-0 first:pt-0">
                        <p class="flex items-center gap-2">
                          <span class="badge badge-soft badge-secondary text-xs">{item.label}</span>
                        </p>
                        <p class="mt-2 text-sm leading-relaxed text-dim">{item.body}</p>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </aside>
          </div>

          <h2 class="font-display text-display font-semibold tracking-tight mt-12">
            What has been exercised
          </h2>
          <p class="mt-4 text-base leading-relaxed text-dim max-w-prose">
            The verification record pairs two kinds of evidence: live probes through the real
            OpenRouter credential, and an offline behavioral suite that runs without any model.
            Together they cover the routing, lifecycle, review, parallelism and recovery machinery.
          </p>
          <div class="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <For each={exercised}>
              {(item) => (
                <article class="card rounded-box border border-line bg-base-200 shadow-rest">
                  <div class="card-body gap-3 p-6">
                    <div class="flex items-center justify-between gap-2">
                      <h3 class="font-display text-title font-semibold tracking-tight">
                        {item.title}
                      </h3>
                      <span class="badge badge-soft badge-secondary text-xs">{item.chip}</span>
                    </div>
                    <p class="text-sm leading-relaxed text-dim">{item.body}</p>
                  </div>
                </article>
              )}
            </For>
          </div>

          <h2 class="font-display text-display font-semibold tracking-tight mt-12">
            What has not been exercised
          </h2>
          <p class="mt-4 text-base leading-relaxed text-dim max-w-prose">
            The record is explicit about its limits, and each limit has a reason rather than a
            silent omission.
          </p>
          <div class="mt-6 grid gap-6 md:grid-cols-2">
            <For each={untested}>
              {(item) => (
                <div class="alert alert-soft alert-warning rounded-box border border-line text-sm items-start">
                  <span class="badge badge-soft badge-warning text-xs shrink-0">Not exercised</span>
                  <span class="min-w-0">
                    <strong>{item.title}.</strong> {item.body}
                  </span>
                </div>
              )}
            </For>
          </div>

          <h2 class="font-display text-display font-semibold tracking-tight mt-12">
            Dependency and version position
          </h2>
          <div class="mt-4 grid items-start gap-10 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:gap-14">
            <div class="min-w-0 text-base leading-relaxed text-dim max-w-prose space-y-4">
              <p>
                Versions were checked against authoritative release sources on{' '}
                <span class="text-base-content">2026-09-20</span> and are pinned in{' '}
                <code class="font-mono text-sm">package.json</code>, with the resolved installation
                recorded in the lockfile; CI installs from the lockfile with{' '}
                <code class="font-mono text-sm">npm ci</code>. The site build was verified locally
                on 2026-09-21 running Node 24.19.0 — an additional compatibility check, not a
                latest-release claim.
              </p>
              <p>
                One prerelease is deliberate: installing stable Nitro 3.0.0 reproducibly failed with
                npm ERESOLVE, because Nitro requires an optional peer Vite ^7 while stable
                SolidStart 2.0.5 requires Vite ^8 or ^9. The registry's current beta adapter is
                selected to keep both on stable releases, and the exception is revisited when a
                compatible stable adapter ships.
              </p>
              <p>
                The skill runtime itself runs without installing its development dependencies. Its
                verified sources, dated 2026-09-19, are Bun 1.4.2, Node latest stable 26.9.0, the
                pi coding agent 0.85.1, TypeScript 7.0.2 (development only) and the Jev decision
                model <span class="font-mono text-sm">typesafe/jev-1.13</span>, verified by a live
                typed response.
              </p>
            </div>
            <div class="min-w-0 overflow-x-auto rounded-box border border-line bg-base-200 shadow-rest">
              <table class="table table-sm">
                <thead class="font-mono text-xs text-dim">
                  <tr>
                    <th>Site dependency</th>
                    <th>Selected stable version</th>
                  </tr>
                </thead>
                <tbody class="text-sm">
                  <For each={siteDeps}>
                    {([name, version]) => (
                      <tr>
                        <td class="font-mono">{name}</td>
                        <td>{version}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>

          <h2 class="font-display text-display font-semibold tracking-tight mt-12">
            Verification gates
          </h2>
          <div class="mt-4 grid items-start gap-10 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:gap-14">
            <div class="min-w-0 text-base leading-relaxed text-dim max-w-prose space-y-4">
              <p>
                Two gate sets guard the delivery. The website gates type-check, prerender every
                route and statically assert headings, titles, brand, metadata, unique ids, link
                containment, resolvable targets, shipped files and WCAG AA contrast, under both the
                root and a prefixed Pages base. The skill gates install from a frozen lockfile and
                run the full behavioral suite under Bun and Node.
              </p>
              <p>
                The production build must be the last step before verification: the render probe
                and the static checker both read the built output and never run it. Every command
                below is re-runnable from the named directory.
              </p>
            </div>
            <div class="min-w-0 space-y-4">
              <figure class="overflow-hidden rounded-box border border-line bg-base-200 shadow-rest">
                <div class="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-xs text-dim">
                  <span>from website/</span>
                  <span class="badge badge-soft badge-primary text-xs">site gates</span>
                </div>
                <pre class="overflow-x-auto p-4 font-mono text-sm leading-relaxed"><code>{`npm ci
npm run check
npm run build
npm run test:static`}</code></pre>
              </figure>
              <figure class="overflow-hidden rounded-box border border-line bg-base-200 shadow-rest">
                <div class="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-xs text-dim">
                  <span>from amale/</span>
                  <span class="badge badge-soft badge-primary text-xs">skill gates</span>
                </div>
                <pre class="overflow-x-auto p-4 font-mono text-sm leading-relaxed"><code>{`bun install --frozen-lockfile
bun run check
bun run test:bun
node --test tests/*.test.ts`}</code></pre>
              </figure>
            </div>
          </div>

          <h2 class="font-display text-display font-semibold tracking-tight mt-12">
            Primary sources
          </h2>
          <p class="mt-4 text-base leading-relaxed text-dim max-w-prose">
            These eight documents are copied unchanged into every build under{' '}
            <span class="font-mono text-sm">sources/</span> — the build ships exactly this list and
            nothing else. Each is described by what you will find inside it, not by a summary of
            this page.
          </p>
          <div class="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <For each={sources}>
              {(source) => (
                <article class="card rounded-box border border-line bg-base-200 shadow-rest">
                  <div class="card-body gap-3 p-6">
                    <div class="flex items-center justify-between gap-2">
                      <h3 class="font-display text-title font-semibold tracking-tight">
                        {source.title}
                      </h3>
                      <span class="badge badge-soft badge-info font-mono font-normal text-xs">
                        {source.file}.md
                      </span>
                    </div>
                    <p class="text-sm leading-relaxed text-dim">{source.body}</p>
                    <a
                      class="link link-hover text-primary text-sm"
                      href={asset(`sources/${source.file}.md`)}
                    >
                      Read the source
                    </a>
                  </div>
                </article>
              )}
            </For>
          </div>

          <p class="mt-12 text-base leading-relaxed text-dim max-w-prose">
            Where this page summarizes, the sources decide. If a sentence here and a sentence in{' '}
            <a class="link link-hover text-primary" href={asset('sources/verification.md')}>
              the verification record
            </a>{' '}
            ever disagree, the source is right and this page should be corrected.
          </p>
        </section>
      </main>
    </>
  );
}
