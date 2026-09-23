const items = [
  {
    key: "outcomes",
    title: "What you get",
    body: "A chunked plan where every chunk is checked and independently reviewed by another model family, and the whole run is resumable from disk after an interruption.",
  },
  {
    key: "savings",
    title: "What it costs",
    body: "This site's own rebuild: 32 model runs across five model families, 9 of them Jev decision calls, 4,139,718 input tokens and 657,001 output tokens — a local estimate of 1.04 US dollars, an estimate rather than a billed figure. The top-tier model directs instead of typing every edit.",
  },
  {
    key: "problems",
    title: "What it fixes",
    body: "An expensive model burning its premium context on micro-decisions, the direction of the work buried under detail, unreviewed cheap-model output, and lost progress after a crash or a cleared session.",
  },
  {
    key: "skills",
    title: "What you learn",
    body: "Directing work like a lead — splitting a feature into independently deliverable chunks, writing acceptance criteria that can be checked, and judging at chunk boundaries instead of every line.",
  },
];

export default function Benefits() {
  return (
    <section
      id="benefits"
      class="mx-auto w-full max-w-7xl px-4 pt-4 pb-16 sm:px-6 md:pt-8 md:pb-24"
    >
      <h2 class="font-display text-display font-semibold tracking-tight">
        Why it matters
      </h2>
      <div class="mt-8 grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <article
            data-benefit={item.key}
            class="card rounded-box border border-line bg-base-200 shadow-rest"
          >
            <div class="card-body gap-3 p-6">
              <h3 class="font-display text-title font-semibold tracking-tight">
                {item.title}
              </h3>
              <p class="text-sm leading-relaxed text-dim">{item.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
