export default function Division() {
  const roles = [
    {
      name: 'Coordinator',
      body: 'The expensive model, kept to minimal turns. Clarifies intent, chunks the work, defines acceptance criteria and integrates results. One delegate call per chunk — no per-step instructions, no hand-written briefs, no micro-management.',
    },
    {
      name: 'Workers',
      body: 'Cheap Flash models that own a chunk end to end — implementation, checks and repair cycles. When a decision is uncertain they consult Jev directly through a bundled helper instead of escalating to the coordinator.',
    },
    {
      name: 'Reviewer',
      body: 'Always the other model family, reading only. Independently verifies each chunk with structured coverage and routes findings back into the worker\'s repair loop rather than to the coordinator.',
    },
    {
      name: 'Jev',
      body: 'A cheap decision model that answers bounded either/or questions for workers and the coordinator. It does not enforce constraints: TypeScript code, not any model, enforces dependencies, ownership, checks and review coverage.',
    },
  ];

  const mechanics = [
    {
      lead: 'Routing is deterministic.',
      body: 'Round-robin across eligible model families, seeded by the run\'s session hash, so work spreads across vendors instead of fixating on one.',
    },
    {
      lead: 'Only genuine boundaries escalate.',
      body: 'Exhausted repair allowances (Flash → Kimi → host), missing evidence and ambiguous intent reach the expensive model; ordinary uncertainty goes to Jev.',
    },
    {
      lead: 'Progress lives on disk.',
      body: 'This is not an unattended background service. A closed session resumes from disk on the next invocation, with its artifacts still in place.',
    },
  ];

  return (
    <section class="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 md:pt-8">
      <h2 class="font-display text-display font-semibold tracking-tight">
        Who does what.
      </h2>
      <p class="mt-4 max-w-prose leading-relaxed text-dim">
        The coordinator holds the direction. Everything inside a chunk runs without it and comes back
        as one outcome to inspect and integrate.
      </p>
      <div class="mt-8 grid gap-6 md:grid-cols-2">
        {roles.map((role) => (
          <article class="card rounded-box border border-line bg-base-200 shadow-rest">
            <div class="card-body gap-3 p-6">
              <h3 class="font-display text-title font-semibold tracking-tight">{role.name}</h3>
              <p class="text-sm leading-relaxed text-dim">{role.body}</p>
            </div>
          </article>
        ))}
      </div>
      <h3 class="mt-12 font-display text-title font-semibold tracking-tight">How it stays cheap.</h3>
      <ul class="mt-4 max-w-prose list-inside list-disc space-y-2 leading-relaxed text-dim">
        {mechanics.map((item) => (
          <li>
            <span class="text-base-content">{item.lead}</span> {item.body}
          </li>
        ))}
      </ul>
    </section>
  );
}
