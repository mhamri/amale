import { asset } from '../../lib/paths';
import { REPOSITORY_URL } from '../../lib/links';
import { Drifter, Glow, LightRays } from '../decor';
import { SponsorButton, StarButton } from '../ProjectActions';

export default function FinalCall() {
  return (
    <section
      id="final-cta"
      class="relative isolate mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24"
    >
      <div class="decor-field" aria-hidden="true">
        <Drifter direction="vertical" distancePx={16}>
          <LightRays hue="primary" apexXFraction={0.5} apexYFraction={-0.06} angleDegrees={0} spreadDegrees={126} opacity={0.24} />
        </Drifter>
        <Glow hue="primary" diameterPx={520} centreXFraction={0.5} centreYFraction={0.16} opacity={0.2} />
      </div>
      <div data-reveal class="max-w-prose">
        <h2 class="font-display text-display font-semibold tracking-tight">
          Direct the next build.
        </h2>
        <p class="mt-4 leading-relaxed text-dim">
          Install once, invoke <span class="font-mono text-base-content">/amaleh</span> with your
          task, and get back work each chunk of which was checked and independently reviewed.
        </p>
        <div class="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <a class="btn btn-primary font-semibold rounded-field" href={asset('docs/getting-started/')}>
            Get started
          </a>
          <SponsorButton />
          <StarButton />
        </div>
        <figure class="mt-8 overflow-hidden rounded-box border border-line bg-base-200 shadow-rest">
          <div class="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-xs text-dim">
            <span>First run</span>
          </div>
          <pre class="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
            <code>{`git clone ${REPOSITORY_URL}`}</code>
          </pre>
        </figure>
      </div>
    </section>
  );
}
