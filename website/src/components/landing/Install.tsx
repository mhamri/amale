const installCommands = `bun amale/scripts/run.ts doctor
bun amale/scripts/run.ts install`;

export default function Install() {
  return (
    <section class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <h2 id="install" class="font-display text-display font-semibold tracking-tight">
        Install once, then invoke /amale with your task.
      </h2>
      <p class="mt-4 max-w-prose leading-relaxed text-dim">
        Use Bun, or Node 24 or newer for the fallback launcher. Configure pi with OpenRouter, or
        provide <code class="font-mono text-sm">OPENROUTER_API_KEY</code> through your environment.
        Never put credentials in the repository.
      </p>
      <figure class="mt-6 max-w-3xl overflow-hidden rounded-box border border-line bg-base-200 shadow-rest">
        <div class="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-xs text-dim">
          <span>shell</span>
        </div>
        <pre class="overflow-x-auto p-4 font-mono text-sm leading-relaxed"><code>{installCommands}</code></pre>
      </figure>
      <p class="mt-4 max-w-prose leading-relaxed text-dim">
        Run these from a stable checkout location. Installation links{' '}
        <code class="font-mono text-sm">amale/</code> into the current user's Codex and Claude skill
        directories and refuses conflicting destinations, so keep the checkout in place afterwards.
      </p>
      <div class="alert alert-soft alert-info mt-6 max-w-3xl rounded-box border border-line text-sm">
        <span>
          Then invoke <span class="font-mono">/amale</span> with your task; the skill handles the
          workflow and resume steps.
        </span>
      </div>
    </section>
  );
}
