import { For } from 'solid-js';
import PageMeta from '../components/PageMeta';
import { asset } from '../lib/paths';

const sources = [
  ['Planning', 'How Amale turns an intent into a checked plan before any work starts.', 'planning'],
  ['Execution', 'Live-catalog model routing, task-specific context, isolated workspaces, and network authorization boundaries.', 'execution'],
  ['Review', 'Fresh cross-model review, structured coverage, persistent repair escalation, and final outcome verification.', 'review'],
  ['Runtime', 'The concrete CLI inputs, outputs, evidence receipts, and host actions that make the workflow inspectable.', 'runtime'],
  ['Parallelism', 'Dependency-ready work, independent review frontiers, capacity limits, and workspace ownership.', 'parallelism'],
  ['Recovery', 'Disk checkpoints, interrupted ownership reconciliation, and handoffs between agent sessions.', 'recovery'],
];

export default function EvidencePage() {
  return (
    <>
      <PageMeta
        title="Evidence — Amale"
        description="The primary sources shipped with Amale and the parts of the workflow that have actually been exercised."
      />
      <main id="main">
        <section class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <h1 class="font-display text-hero font-semibold tracking-tight">Evidence</h1>
          <p class="mt-4 text-base leading-relaxed text-dim max-w-prose">
            Amale is built from documents that travel with the skill. This page lists the
            primary sources shipped in every build and describes, plainly, what has been
            exercised and what has not.
          </p>

          <h2 class="font-display text-display font-semibold tracking-tight mt-12">The name</h2>
          <article class="card rounded-box border border-line bg-base-200 shadow-rest mt-4">
            <div class="card-body gap-3 p-6">
              <p class="text-sm leading-relaxed text-dim max-w-prose">
                The project's name is <span lang="fa" dir="rtl">عمله</span>, transliterated
                as <em>ʿamalah</em> <span class="font-mono text-sm text-dim">/ AH-mah-lah /</span>.
                It is a Persian word meaning <strong>workers / laborers</strong> — people
                contributing effort to a shared result. <em>Amale</em> is the project's
                Latin-script name.
              </p>
            </div>
          </article>

          <h2 class="font-display text-display font-semibold tracking-tight mt-12">Primary sources</h2>
          <p class="mt-4 text-base leading-relaxed text-dim max-w-prose">
            These documents are copied into every build. Read them for the detail behind the
            claims on this page.
          </p>
          <div class="mt-6 grid gap-6 md:grid-cols-2">
            <For each={sources}>
              {([title, description, path]) => (
                <article class="card rounded-box border border-line bg-base-200 shadow-rest">
                  <div class="card-body gap-3 p-6">
                    <h3 class="font-display text-title font-semibold tracking-tight">{title}</h3>
                    <p class="text-sm leading-relaxed text-dim">{description}</p>
                    <a
                      class="link link-hover text-primary text-sm"
                      href={asset(`sources/${path}.md`)}
                    >
                      Read the source
                    </a>
                  </div>
                </article>
              )}
            </For>
          </div>

          <h2 class="font-display text-display font-semibold tracking-tight mt-12">What has been exercised</h2>
          <div class="alert alert-soft alert-success rounded-box border border-line text-sm mt-4">
            <span>
              <strong>Verified.</strong> The installer links the canonical skill directory into
              Claude and Codex; there are no external skill dependencies and no npm runtime
              dependencies. A real OpenRouter Jev decisions request succeeded, and a live
              isolated billing fixture traversed Jev routing, implementation, an independent
              read-only review, exact amount tests, and acceptance, integration, and completion.
              Behavioral tests cover valid completion, graph validation, stale and failed checks,
              independent review, repair escalation, concurrent checkpointing, dependency-ready
              progress, conflicting workspaces, live and dead ownership, decision uncertainty,
              artifact retention, HTML escaping, installation reruns, completed-run resume,
              upstream invalidation, cross-host takeover, and contract amendment. Static checking
              uses TypeScript strict mode, and the skill-creator validator passes. Bun-first
              launching and Node fallback were exercised, including an empty PATH.
            </span>
          </div>
          <div class="alert alert-soft alert-info rounded-box border border-line text-sm mt-4">
            <span>
              <strong>Scope of the live check.</strong> A live fixture demonstrates a working
              path; it does not establish general model quality, speed, or cost. Windows was
              exercised; macOS and Linux paths use portable APIs but have not been run here.
              The live smoke test is a historical development observation, not an offline-suite
              requirement or a general benchmark. The verification record describes the tested
              scope and its limits in full.
            </span>
          </div>
          <p class="mt-4 text-sm leading-relaxed text-dim max-w-prose">
            The full verification record lists tested dependency and runtime sources, practical
            limits, and reproducible verification steps.
          </p>
          <a
            class="link link-hover text-primary text-sm mt-2 inline-block"
            href={asset('sources/verification.md')}
          >
            Read the verification record
          </a>
        </section>
      </main>
    </>
  );
}
