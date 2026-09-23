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
      <div class="relative isolate border-b border-line">
        <div class="decor-field" aria-hidden="true">
          <Glow hue="secondary" diameterPx={2200} centreXFraction={0.5} centreYFraction={0.5} opacity={0.45} />

          <Blobs hue="primary" diameterPx={500} centreXFraction={0.692} centreYFraction={-0.016} blurPx={30} opacity={0.85} class="lg:hidden" />

          <Blobs hue="primary" diameterPx={1000} centreXFraction={0.903} centreYFraction={1.115} blurPx={50} opacity={0.8} class="hidden xl:block" />
          <Blobs hue="secondary" diameterPx={900} centreXFraction={1.017} centreYFraction={1.537} blurPx={60} opacity={0.75} class="hidden xl:block" />

          <LightRays hue="primary" apexXFraction={0.5} apexYFraction={0} spreadDegrees={130} opacity={0.4} />
          <Rings hue="secondary" diameterPx={420} centreXFraction={0.9} centreYFraction={0.3} opacity={0.35} class="hidden sm:block" />
          <GridDots hue="secondary" spacingPx={26} centreXFraction={0.7} centreYFraction={0} opacity={0.3} />
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
