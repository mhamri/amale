import { asset } from '../../lib/paths';

const docsTopics = [
  'The problem',
  'Getting started',
  'The workflow',
  'Review and recovery',
  'Command reference',
];

export default function Continue() {
  return (
    <section class="border-y border-line bg-base-200/50">
      <div class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <h2 class="font-display text-display font-semibold tracking-tight">
          Read it before you trust it.
        </h2>
        <p class="mt-4 max-w-prose leading-relaxed text-dim">
          The documentation takes the same workflow apart page by page, and the evidence page points
          at the primary sources shipped with the build.
        </p>
        <div class="mt-8 grid gap-6 md:grid-cols-2">
          <article class="card rounded-box border border-line bg-base-200 shadow-rest">
            <div class="card-body gap-3 p-6">
              <h3 class="font-display text-title font-semibold tracking-tight">Documentation</h3>
              <ul class="flex flex-wrap gap-2">
                {docsTopics.map((topic) => (
                  <li class="badge badge-primary text-sm">{topic}</li>
                ))}
              </ul>
              <p class="text-sm leading-relaxed text-dim">
                From the problem Amale solves through installation, the workflow, review and recovery,
                to a command reference drawn from the skill's own reference files.
              </p>
              <a class="link link-hover text-primary" href={asset('docs/')}>
                Read the documentation
              </a>
            </div>
          </article>
          <article class="card rounded-box border border-line bg-base-200 shadow-rest">
            <div class="card-body gap-3 p-6">
              <h3 class="font-display text-title font-semibold tracking-tight">Evidence</h3>
              <p class="text-sm leading-relaxed text-dim">
                The record behind the workflow: review and acceptance, verification and its limits, and
                the reference documents shipped with this site.
              </p>
              <a class="link link-hover text-primary" href={asset('evidence/')}>
                See the evidence
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
