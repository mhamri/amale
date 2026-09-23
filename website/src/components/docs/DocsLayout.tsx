import { For, Show, type JSX } from 'solid-js';
import { asset } from '../../lib/paths';
import { Blobs, Glow, GridDots, LightRays, Rings } from '../decor';

/**
 * Shared documentation shell. Every `sections` entry must match the `id`
 * of a heading in the children — the on-page table of contents anchors to
 * those ids.
 */

export type DocsPageId =
  | 'overview'
  | 'getting-started'
  | 'workflow'
  | 'review-and-recovery'
  | 'commands';

export type DocsSection = { id: string; label: string };

const pages: { id: DocsPageId; label: string; href: string }[] = [
  { id: 'overview', label: 'Overview', href: 'docs/' },
  { id: 'getting-started', label: 'Getting started', href: 'docs/getting-started/' },
  { id: 'workflow', label: 'Workflow', href: 'docs/workflow/' },
  { id: 'review-and-recovery', label: 'Review and recovery', href: 'docs/review-and-recovery/' },
  { id: 'commands', label: 'Command reference', href: 'docs/commands/' },
];

export default function DocsLayout(props: {
  current: DocsPageId;
  title: string;
  lead: string;
  sections?: DocsSection[];
  children: JSX.Element;
}) {
  const sections = () => props.sections ?? [];
  return (
    <main id="main">
      {/* Header band: a full-bleed band behind the page title, lit so the
          header reads as depth rather than as an article with a heading. A
          wide, dim teal bloom sets the mean hue of the whole band; a brass
          lamp sits above the title on a phone and right of the prose measure
          from xl up; rays, a gauge ring and the ledger's dot field frame it.
          The band is clipped (`decor-field`), has no background of its own,
          and every layer fades radially or through a mask, so it is light on
          the page and never a tinted rectangle. Measured on the built site at
          390, 768, 1024 and 1440 CSS pixels, the only `dim` element in the
          band is the lead, and it stays above 4.7:1; the title is
          `base-content` and stays above 7.9:1. */}
      <div class="relative isolate border-b border-line">
        <div class="decor-field" aria-hidden="true">
          {/* Broad wash: a wide, dim teal bloom centred on the band. It lifts
              the mean chroma of the whole header without lifting the copy,
              because its peak stays under the documented lit-background
              level. */}
          <Glow hue="secondary" size={2200} cx={0.5} cy={0.5} opacity={0.45} />

          {/* Phone: a small brass lamp above the title. Its bright core sits
              clear of the copy, so the strong hue lands on the header's top
              edge and the title never rides on it. */}
          <Blobs hue="primary" size={500} cx={0.692} cy={-0.016} blur={30} opacity={0.85} class="lg:hidden" />

          {/* Desktop: the lamp moves right of the prose measure, and a second
              teal pool sits at the band's lower-right corner. */}
          <Blobs hue="primary" size={1000} cx={0.903} cy={1.115} blur={50} opacity={0.8} class="hidden xl:block" />
          <Blobs hue="secondary" size={900} cx={1.017} cy={1.537} blur={60} opacity={0.75} class="hidden xl:block" />

          {/* Shape and rays frame the band at every width. */}
          <LightRays hue="primary" cx={0.5} cy={0} spread={130} opacity={0.4} />
          <Rings hue="secondary" size={420} cx={0.9} cy={0.3} opacity={0.35} class="hidden sm:block" />
          <GridDots hue="secondary" spacing={26} cx={0.7} cy={0} opacity={0.3} />
        </div>
        <div class="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <header class="pb-12 pt-32 md:pb-14">
            <div class="max-w-prose" data-reveal>
              <h1 class="font-display text-display font-semibold tracking-tight">{props.title}</h1>
              <p class="mt-3 text-lg leading-relaxed text-dim">{props.lead}</p>
            </div>
          </header>
        </div>
      </div>
      <div class="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-14">
        <div class="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_14rem]">
          <aside class="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <nav aria-label="Documentation">
              <ul class="menu w-full gap-0.5 rounded-box border border-line bg-base-200 p-2 font-mono text-sm">
                <li class="menu-title text-dim">Docs</li>
                <For each={pages}>
                  {(page) => (
                    <li>
                      <a
                        class={
                          page.id === props.current
                            ? 'bg-base-300 font-medium text-base-content'
                            : 'text-dim hover:bg-base-300'
                        }
                        href={asset(page.href)}
                        aria-current={page.id === props.current ? 'page' : undefined}
                      >
                        {page.label}
                      </a>
                    </li>
                  )}
                </For>
              </ul>
            </nav>
          </aside>
          <article class="min-w-0">
            <Show when={sections().length > 0}>
              <nav
                data-reveal
                class="mt-8 block rounded-box border border-line bg-base-200 p-5 shadow-rest xl:hidden"
                aria-label="On this page"
              >
                <p class="font-mono text-sm text-dim">On this page</p>
                <ul class="mt-3 space-y-2 text-sm">
                  <For each={sections()}>
                    {(section) => (
                      <li>
                        <a class="link link-hover text-primary" href={`#${section.id}`}>
                          {section.label}
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </nav>
            </Show>
            <div class="mt-10 space-y-12">{props.children}</div>
          </article>
          <aside class="min-w-0 hidden xl:block xl:sticky xl:top-24 xl:self-start">
            <nav aria-label="On this page">
              <Show when={sections().length > 0}>
                <p class="font-mono text-sm text-dim mb-3">On this page</p>
                <ul class="space-y-2 text-sm">
                  <For each={sections()}>
                    {(section) => (
                      <li>
                        <a class="link link-hover text-primary" href={`#${section.id}`}>
                          {section.label}
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </nav>
          </aside>
        </div>
      </div>
    </main>
  );
}
