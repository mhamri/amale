import HeroCanvas from "./HeroCanvas";

export default function Problem() {
  return (
    <section class="mx-auto w-full max-w-7xl px-4 pb-4 pt-16 sm:px-6 md:pb-8 md:pt-24">
      <div class="grid items-start gap-10 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:gap-14">
        <div class="min-w-0">
          <h1 class="animate-rise font-display text-hero font-semibold tracking-tight">
            Turn a top-tier model into a director.
          </h1>
          <p class="mt-5 max-w-prose text-lg leading-relaxed text-dim">
            Without structure, an expensive model spends its premium context
            writing every edit, every check and every micro-decision, and the
            direction of the work gets buried under the detail.
          </p>
          <p class="mt-4 max-w-prose leading-relaxed text-dim">
            Amale turns that model into a director instead of a laborer: it
            segments work into chunks with clear outcomes, delegates each chunk
            to cheap Flash models, and verifies direction only at chunk
            boundaries — the same verified delivery at a fraction of the token
            cost.
          </p>
          <p class="mt-6 max-w-prose leading-relaxed text-dim">
            The name is{" "}
            <span lang="fa" dir="rtl">
              عمله
            </span>{" "}
            — Persian in origin, pronounced{" "}
            <span class="text-base-content">Ah-mah-leh</span>, meaning{" "}
            <span class="text-base-content">workers / laborers</span>.{" "}
            <em>Amale</em> is the project's Latin-script name: coordinated
            workers contributing to a shared, verified outcome.
          </p>
        </div>

        <div class="min-w-0">
          <figure class="overflow-hidden rounded-box border border-line bg-base-200 shadow-rest">
            <div class="aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[16/9]">
              <HeroCanvas />
            </div>
            <figcaption class="border-t border-line px-4 py-3 text-sm text-dim">
              One run, live: the brass coordinator sends chunks out to the routed
              worker models, violet marks the bounded questions workers put to
              Jev, and teal marks a chunk reviewed by another family and
              accepted back.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
