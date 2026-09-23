import { asset } from '../../lib/paths';

const docsTopics = [
  'The problem',
  'Getting started',
  'The workflow',
  'Review and recovery',
  'Command reference',
];

const sourceTopics = [
  'planning',
  'execution',
  'review',
  'runtime',
  'parallelism',
  'recovery',
  'verification',
  'effort',
];

export default function Continue() {
  return (
    <section class="border-y border-line bg-base-200/50">
      <div class="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <h2 class="font-display text-display font-semibold tracking-tight">
          Read it before you trust it.
        </h2>
        <p class="mt-4 max-w-prose leading-relaxed text-dim">
          The documentation takes the workflow apart page by page, the evidence page states what has
          been exercised and what has not, and the primary sources ship with the build so every
          claim can be checked in full.
        </p>
        <div class="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-2">
          <article class="card rounded-box border border-line bg-base-200 shadow-rest">
            <div class="card-body gap-3 p-6">
              <div class="flex items-start justify-between gap-3">
                <h3 class="font-display text-title font-semibold tracking-tight">Documentation</h3>
                <span class="badge badge-soft badge-primary shrink-0 text-xs">Five pages</span>
              </div>
              <ul class="flex flex-wrap gap-2">
                {docsTopics.map((topic) => (
                  <li class="badge badge-soft badge-primary text-sm">{topic}</li>
                ))}
              </ul>
              <p class="text-sm leading-relaxed text-dim">
                From the problem Amale solves through installation, the workflow, review and
                recovery, to a command reference drawn from the skill's own reference files.
              </p>
              <a class="link link-hover text-primary" href={asset('docs/')}>
                Read the documentation
              </a>
            </div>
          </article>
          <article class="card rounded-box border border-line bg-base-200 shadow-rest">
            <div class="card-body gap-3 p-6">
              <div class="flex items-start justify-between gap-3">
                <h3 class="font-display text-title font-semibold tracking-tight">Evidence</h3>
                <span class="badge badge-soft badge-secondary shrink-0 text-xs">Verified and untested</span>
              </div>
              <p class="text-sm leading-relaxed text-dim">
                The record behind the workflow: the live checks and behavioral suite that were
                actually run, the limits the record states with reasons, the dependency position,
                and the gates you can re-run yourself.
              </p>
              <a class="link link-hover text-primary" href={asset('evidence/')}>
                See the evidence
              </a>
            </div>
          </article>
          <article class="card rounded-box border border-line bg-base-200 shadow-rest">
            <div class="card-body gap-3 p-6">
              <div class="flex items-start justify-between gap-3">
                <h3 class="font-display text-title font-semibold tracking-tight">Primary sources</h3>
                <span class="badge badge-soft badge-info shrink-0 text-xs">Eight files</span>
              </div>
              <ul class="flex flex-wrap gap-2">
                {sourceTopics.map((topic) => (
                  <li class="badge badge-soft badge-info font-mono font-normal text-sm">
                    {topic}.md
                  </li>
                ))}
              </ul>
              <p class="text-sm leading-relaxed text-dim">
                The reference documents shipped unchanged with this build — where the claims on
                every page of this site are written out in full.
              </p>
              <a class="link link-hover text-primary" href={asset('evidence/')}>
                Browse the sources
              </a>
            </div>
          </article>
        </div>
        <p class="mt-8 text-sm leading-relaxed text-dim">
          The skill, its source and its issues are on{' '}
          <a
            class="link link-hover text-primary"
            href="https://github.com/mhamri/amale"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </section>
  );
}
