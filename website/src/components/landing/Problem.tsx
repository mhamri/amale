import HeroCanvas from "./HeroCanvas";
import { SPONSOR_URL } from "../../lib/links";
import { asset } from "../../lib/paths";

export default function Problem() {
  return (
    <section class="relative isolate overflow-hidden">
      {/* Full-bleed scene: it spans the hero band edge to edge behind the
          copy and carries no caption of its own. What the scene shows is
          explained beside the topology diagram further down the page. */}
      <div class="absolute inset-0">
        <HeroCanvas />
      </div>
      {/* The copy is one compact block on the left. The scene keeps the rest
          of the band: every model tile sits at x >= 10.5 of the scene's 16
          design units, so no headline, paragraph or button reaches a tile at
          1024 CSS pixels and wider. */}
      <div class="relative mx-auto w-full max-w-7xl px-4 pb-4 pt-16 sm:px-6 md:pb-8 md:pt-24">
        <div class="animate-rise max-w-xl">
          <h1 class="font-display text-hero font-semibold tracking-tight">
            Big-model delivery on a cheap-model budget, every chunk verified.
          </h1>
          <p class="mt-5 max-w-prose text-lg leading-relaxed text-dim">
            Amale plans the work, hands each chunk to a cheap Flash model, reviews the result and
            verifies it before the next step. You get the same verified delivery at a fraction of
            the token cost.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a
              class="btn btn-primary font-semibold rounded-field"
              href={asset('docs/getting-started/')}
            >
              Get started
            </a>
            <a
              class="btn btn-outline border-line text-base-content hover:bg-base-200"
              href={SPONSOR_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Sponsor
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}