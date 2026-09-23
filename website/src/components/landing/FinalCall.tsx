import { asset } from '../../lib/paths';
import { REPOSITORY_URL, SPONSOR_URL } from '../../lib/links';

export default function FinalCall() {
  return (
    <section id="final-cta" class="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24">
      <h2 class="font-display text-display font-semibold tracking-tight">
        Ready to direct instead of type?
      </h2>
      <p class="mt-4 max-w-prose leading-relaxed text-dim">
        A top-tier model sets the plan and reviews each chunk while cheap Flash workers
        execute — every step independently verified, the run resumable from disk.
      </p>
      <div class="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <a
          class="btn btn-primary font-semibold rounded-field"
          href={asset('docs/getting-started/')}
        >
          Get started
        </a>
        <a
          class="btn btn-outline border-line text-base-content hover:bg-base-200 rounded-field"
          href={SPONSOR_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Sponsor
        </a>
      </div>
      <figure class="mt-8 max-w-prose overflow-hidden rounded-box border border-line bg-base-200 shadow-rest">
        <div class="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-xs text-dim">
          <span>First run</span>
        </div>
        <pre class="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
          <code>{`git clone ${REPOSITORY_URL}`}</code>
        </pre>
      </figure>
    </section>
  );
}
