import HeroCanvas from "./HeroCanvas";

export default function Problem() {
  return (
    <section class="relative isolate overflow-hidden">
      {/* Full-bleed scene: it spans the hero band edge to edge behind the
          copy and carries no caption of its own — what the scene shows is
          explained by the orchestration diagram further down the page. */}
      <div class="absolute inset-0">
        <HeroCanvas />
      </div>
      <div class="relative mx-auto w-full max-w-7xl px-4 pb-4 pt-16 sm:px-6 md:pb-8 md:pt-24">
        <h1 class="animate-rise font-display text-hero font-semibold tracking-tight">
          32 cheap-model runs rebuilt this site, for a local estimate of $1.04.
          Amale turns a top-tier model into a director of cheap ones.
        </h1>
        <p class="mt-5 max-w-prose text-lg leading-relaxed text-dim">
          That headline is this site's own rebuild record: 32 model runs across
          five model families, 9 of them Jev decision calls, moving 4,139,718
          input tokens and 657,001 output tokens — a local estimate of 1.04 US
          dollars, an estimate rather than a billed figure, against the 0.0003
          US dollars the gateway reported.
        </p>
        <p class="mt-4 max-w-prose leading-relaxed text-dim">
          Without structure, an expensive model spends its premium context
          writing every edit, every check and every micro-decision, and the
          direction of the work gets buried under the detail.
        </p>
        <p class="mt-4 max-w-prose leading-relaxed text-dim">
          Amale is that structure: it segments work into chunks with clear
          outcomes, delegates each chunk to cheap Flash models, and verifies
          direction only at chunk boundaries — the same verified delivery at a
          fraction of the token cost.
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
    </section>
  );
}