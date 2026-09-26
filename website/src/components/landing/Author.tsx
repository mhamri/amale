import { asset } from '../../lib/paths';
import { GITHUB_PROFILE_URL, LINKEDIN_URL, X_URL } from '../../lib/links';
import { Glow, GridDots } from '../decor';

const connections = [
  {
    name: 'GitHub',
    href: GITHUB_PROFILE_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" class="size-4" aria-hidden="true">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: LINKEDIN_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" class="size-4" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
      </svg>
    ),
  },
  {
    name: 'X',
    href: X_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" class="size-4" aria-hidden="true">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
      </svg>
    ),
  },
];

export default function Author() {
  return (
    <section id="author" class="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24">
      <article
        data-reveal
        class="relative isolate overflow-hidden rounded-box border border-line bg-base-200 shadow-rest-glow-primary"
      >
        <div class="decor-field" aria-hidden="true">
          <Glow hue="primary" diameterPx={480} centreXFraction={0.1} centreYFraction={0.15} opacity={0.45} />
          <GridDots hue="primary" spacingPx={28} centreXFraction={0.9} centreYFraction={0.95} opacity={0.3} />
        </div>
        <div class="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start sm:gap-8 md:p-8">
          <img
            src={asset('author/avatar.jpg')}
            alt="Portrait of Mohammad Hossein Amri"
            width={144}
            height={144}
            class="size-36 shrink-0 rounded-full border border-line object-cover"
          />
          <div class="min-w-0">
            <h2 class="font-display text-display font-semibold tracking-tight">Get connected.</h2>
            <p class="mt-3 max-w-prose text-sm leading-relaxed text-dim">
              Amaleh is built by Mohammad Hossein Amri, a software engineer in Kuala Lumpur,
              Malaysia. He has over 13 years in the industry, works at menumiz (AU), and writes
              C#/.NET, TypeScript and cloud applications. He built Amaleh to direct cheap models
              instead of typing every edit with an expensive one.
            </p>
            <p class="mt-3 max-w-prose text-sm leading-relaxed text-dim">
              The name is the Persian word{' '}
              <span lang="fa" dir="rtl" class="text-base-content">
                عمله
              </span>
              , pronounced Ah-mah-leh, meaning workers or laborers.
            </p>
            <ul class="mt-5 flex flex-wrap gap-3">
              {connections.map((connection) => (
                <li>
                  <a
                    class="btn btn-outline btn-sm border-line text-base-content hover:bg-base-300"
                    href={connection.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${connection.name} profile of Mohammad Hossein Amri`}
                  >
                    {connection.icon}
                    <span>{connection.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>
    </section>
  );
}
