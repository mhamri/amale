import { asset } from '../../lib/paths';

const credentials = [
  { label: 'GitHub', value: 'mhamri, since October 2014' },
  { label: 'Public repositories', value: '64' },
  { label: 'Company', value: 'Planally' },
  { label: 'Website', value: 'mhamri.com' },
];

export default function Author() {
  return (
    <section id="author">
      <div class="mx-auto w-full max-w-7xl px-4 pb-16 pt-4 sm:px-6 md:pb-24 md:pt-8">
        <div class="grid items-start gap-10 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:gap-14">
          <div class="min-w-0">
            <h2 class="font-display text-display font-semibold tracking-tight">
              Who built Amale.
            </h2>
            <p class="mt-4 max-w-prose leading-relaxed text-dim">
              Amale was created by{' '}
              <a
                class="link link-hover text-primary"
                href="https://github.com/mhamri"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mohammad Hossein Amri
              </a>
              . The GitHub profile bio reads "Good code is an art", and the work behind Amale holds
              to it: a workflow skill built to be read, checked and resumed rather than merely run.
            </p>
            <p class="mt-4 max-w-prose leading-relaxed text-dim">
              The name is the Persian word{' '}
              <span lang="fa" dir="rtl" class="text-base-content">
                عمله
              </span>{' '}
              — pronounced Ah-mah-leh, meaning workers / laborers. Amale is the project's
              Latin-script name for coordinated workers contributing to a shared, verified outcome.
            </p>
            <p class="mt-4 max-w-prose leading-relaxed text-dim">
              The qualification that matters is the one this project demonstrates: Mohammad Hossein
              Amri designed and built Amale, and this website was itself rebuilt through Amale's own
              delegated runs.
            </p>
            <p class="mt-6 flex flex-wrap gap-4 text-sm">
              <a
                class="link link-hover text-primary"
                href="https://github.com/mhamri"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/mhamri
              </a>
              <a
                class="link link-hover text-primary"
                href="https://mhamri.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                mhamri.com
              </a>
            </p>
          </div>
          <div class="min-w-0 space-y-6">
            <article class="card overflow-hidden rounded-box border border-line bg-base-200 shadow-rest">
              <figure class="m-0">
                <img
                  src={asset('author/avatar.jpg')}
                  alt="Portrait of Mohammad Hossein Amri"
                  width="420"
                  height="420"
                  class="aspect-square w-full object-cover"
                />
                <figcaption class="border-t border-line px-4 py-3 text-sm text-dim">
                  The website listed on the GitHub profile:{' '}
                  <a
                    class="link link-hover text-primary"
                    href="https://mhamri.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    mhamri.com
                  </a>
                </figcaption>
              </figure>
            </article>
            <article class="card rounded-box border border-line bg-base-200 shadow-rest">
              <div class="card-body gap-3 p-6">
                <div class="flex items-start justify-between gap-3">
                  <h3 class="font-display text-title font-semibold tracking-tight">Credentials</h3>
                  <span class="badge badge-soft badge-secondary shrink-0 text-xs">
                    From the public profile
                  </span>
                </div>
                <ul class="space-y-2 text-sm leading-relaxed text-dim">
                  {credentials.map((credential) => (
                    <li class="flex items-baseline justify-between gap-4 border-t border-line pt-2 first:border-t-0 first:pt-0">
                      <span class="text-dim">{credential.label}</span>
                      <span class="text-base-content">{credential.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}