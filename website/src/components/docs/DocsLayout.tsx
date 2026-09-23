import { For, Show, type JSX } from 'solid-js';
import { asset } from '../../lib/paths';
import { Glow, LightRays } from '../decor';

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
      <div class="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24">
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
            {/* Header band: a full-width light-ray wash behind the page title,
                held at low opacity so it reads as warmth on the graphite, never
                as a shape over the copy. A small secondary glow pins the band's
                left edge for a near/far cue at a glance. */}
            <div class="relative isolate">
              <div
                class="decor-field"
                aria-hidden="true"
              >
                <LightRays
                  hue="primary"
                  cx={0.5}
                  cy={0}
                  spread={108}
                  opacity={0.28}
                />
                <Glow hue="secondary" size={360} cx={0.08} cy={0.12} opacity={0.34} />
              </div>
              <header class="border-b border-line pb-6">
                <div class="max-w-prose">
                  <h1 class="font-display text-display font-semibold tracking-tight">{props.title}</h1>
                  <p class="mt-3 text-lg leading-relaxed text-dim">{props.lead}</p>
                </div>
              </header>
            </div>
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
