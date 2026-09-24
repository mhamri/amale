import { asset } from '../lib/paths';
import { Glow, GridDots } from './decor';

const siteLinks = [
  { label: 'Overview', href: asset('') },
  { label: 'Docs', href: asset('docs/') },
  { label: 'Case study', href: asset('case-study/') },
];

const projectLinks = [
  { label: 'GitHub repository', href: 'https://github.com/mhamri/amaleh' },
  { label: 'Documentation', href: asset('docs/') },
];

export default function Footer() {
  return (
    <footer class="relative isolate overflow-hidden border-t border-line bg-base-200/50">
      <div class="decor-field" aria-hidden="true" data-reveal>
        <GridDots hue="primary" spacingPx={32} centreXFraction={0.5} centreYFraction={1} opacity={0.35} />
        <Glow hue="primary" diameterPx={760} centreXFraction={0.5} centreYFraction={1.2} opacity={0.4} />
      </div>
      <div class="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div class="footer gap-10 sm:footer-horizontal">
          <aside class="max-w-sm">
            <a href={asset('')} class="flex items-center gap-2.5 rounded-field" aria-label="Amaleh home">
              <img src={asset('mark.svg')} width="30" height="30" alt="" class="size-[30px]" />
              <span class="font-display text-xl font-semibold tracking-tight">amaleh</span>
            </a>
            <p class="mt-3 text-sm leading-relaxed text-dim">
              A coding workflow for Codex and Claude that plans, builds, reviews and verifies — and
              picks up exactly where it left off.
            </p>
          </aside>
          <nav aria-label="Site">
            <p class="footer-title font-mono text-sm font-medium text-base-content">Site</p>
            <ul class="mt-2 space-y-1.5">
              {siteLinks.map((link) => (
                <li>
                  <a class="link-hover link text-sm text-dim" href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Project">
            <p class="footer-title font-mono text-sm font-medium text-base-content">Project</p>
            <ul class="mt-2 space-y-1.5">
              {projectLinks.map((link) => (
                <li>
                  <a
                    class="link-hover link text-sm text-dim"
                    href={link.href}
                    {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div class="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-dim sm:flex-row sm:items-center sm:justify-between">
          <p>ʿamalah (Ah-mah-leh) — Persian for workers / laborers.</p>
          <p>
            Source and issues on{' '}
            <a class="link-hover link text-base-content" href="https://github.com/mhamri/amaleh" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
