import { Glow, GridDots, Rings } from '../decor';

const installCommands = `git clone https://github.com/mhamri/amale
cd amale
bun amale/scripts/run.ts doctor
bun amale/scripts/run.ts install`;

const installFacts = [
  {
    lead: 'Links, never copies.',
    body: 'Install links the canonical skill directory into the default Claude and Codex skill directories, so the checkout stays the single source of truth.',
  },
  {
    lead: 'Refuses conflicting targets.',
    body: 'A conflicting destination is refused rather than overwritten, so an existing installation is never silently replaced. Keep the checkout in place afterwards.',
  },
  {
    title: 'doctor',
    body: 'checks local setup before anything network-facing; the startup preflight covers network connectivity separately.',
  },
  {
    lead: 'Fallback launcher.',
    body: 'Node 24 or newer runs the erasable TypeScript directly when Bun is absent, so the same commands work without a second toolchain.',
  },
];

export default function Install() {
  return (
    <section class="relative isolate mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24">
      <div class="decor-field" aria-hidden="true">
        <Glow hue="secondary" size={560} cx={0.9} cy={0.12} opacity={0.22} />
        <Rings hue="secondary" size={460} cx={0.06} cy={0.9} opacity={0.22} />
        <GridDots hue="primary" spacing={32} cx={0.14} cy={0.1} opacity={0.18} />
      </div>
      <div class="grid items-start gap-10 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:gap-14">
        <div class="min-w-0" data-reveal>
          <h2
            id="install"
            class="font-display text-display font-semibold tracking-tight"
          >
            Two commands to install.
          </h2>
          <p class="mt-4 max-w-prose leading-relaxed text-dim">
            Clone the repository and run both commands from the checkout root. Invoke{' '}
            <span class="font-mono text-base-content">/amale</span> with your task afterwards; the
            skill handles the workflow and resume steps.
          </p>
          <figure class="mt-6 overflow-hidden rounded-box border border-line bg-base-200 shadow-rest">
            <div class="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-xs text-dim">
              <span>shell</span>
            </div>
            <pre class="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
              <code>{installCommands}</code>
            </pre>
          </figure>
        </div>
        <div class="min-w-0 space-y-6" data-reveal>
          <article class="card rounded-box border border-line bg-base-200 shadow-raised-glow-secondary">
            <div class="card-body gap-4 p-6">
              <p class="font-mono text-sm text-dim">What install actually does</p>
              <ul class="space-y-4">
                {installFacts.map((fact) => (
                  <li class="border-t border-line pt-4 first:border-t-0 first:pt-0">
                    <p class="text-sm leading-relaxed text-dim">
                      {fact.title ? (
                        <>
                          <code class="font-mono text-sm text-base-content">{fact.title}</code>{' '}
                          {fact.body}
                        </>
                      ) : (
                        <>
                          <span class="text-base-content">{fact.lead}</span> {fact.body}
                        </>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </article>
          <div class="card rounded-box border border-line bg-base-200 shadow-rest">
            <div class="card-body gap-3 p-6">
              <div class="flex items-start justify-between gap-3">
                <h3 class="font-display text-title font-semibold tracking-tight">Credentials</h3>
                <span class="badge badge-soft badge-warning shrink-0 text-xs">
                  Never in the repository
                </span>
              </div>
              <p class="text-sm leading-relaxed text-dim">
                Configure pi with OpenRouter, or provide{' '}
                <code class="font-mono text-sm">OPENROUTER_API_KEY</code> through your environment.
                The runtime reads existing credential configuration and never prints or writes the
                key into artifacts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
