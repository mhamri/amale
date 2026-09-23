import { asset } from '../lib/paths';

const primaryLinks = [
  { label: 'Overview', href: asset('') },
  { label: 'Docs', href: asset('docs/') },
  { label: 'Evidence', href: asset('evidence/') },
];

const github = { label: 'GitHub', href: 'https://github.com/mhamri/amale' };

function Brand() {
  return (
    <a href={asset('')} class="flex items-center gap-2.5 rounded-field" aria-label="Amale home">
      <img src={asset('mark.svg')} width="30" height="30" alt="" class="size-[30px]" />
      <span class="font-display text-xl font-semibold tracking-tight">amale</span>
    </a>
  );
}

function MenuList() {
  return (
    <ul class="menu w-56 gap-0.5 rounded-box border border-line bg-base-200 p-1.5 shadow-raised">
      {primaryLinks.map((link) => (
        <li>
          <a class="text-sm text-dim hover:bg-base-300 hover:text-base-content" href={link.href}>
            {link.label}
          </a>
        </li>
      ))}
      <li class="mt-1 border-t border-line pt-1">
        <a class="text-sm font-medium text-primary hover:bg-base-300" href={github.href} target="_blank" rel="noopener noreferrer">
          {github.label}
        </a>
      </li>
    </ul>
  );
}

export default function Header() {
  return (
    <header class="sticky top-0 z-50 border-b border-line bg-base-100/85 shadow-rest backdrop-blur-md">
      <div class="navbar mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Brand />
        <div class="ms-auto flex items-center gap-1.5">
          <nav aria-label="Primary" class="hidden md:block">
            <ul class="menu menu-horizontal gap-0.5 px-0">
              {primaryLinks.map((link) => (
                <li>
                  <a class="rounded-field text-sm text-dim hover:bg-base-200 hover:text-base-content" href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <a class="btn btn-primary btn-sm hidden rounded-field font-semibold sm:inline-flex" href={github.href} target="_blank" rel="noopener noreferrer">
            {github.label}
          </a>
          <details class="dropdown dropdown-end md:hidden">
            <summary class="btn btn-square btn-sm border-line bg-base-200 hover:bg-base-300" aria-label="Open menu">
              <svg viewBox="0 0 20 20" fill="currentColor" class="size-5" aria-hidden="true">
                <path d="M3 5.75A.75.75 0 0 1 3.75 5h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 5.75Zm0 4.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10Zm.75 3.5a.75.75 0 0 0 0 1.5h12.5a.75.75 0 0 0 0-1.5H3.75Z" />
              </svg>
            </summary>
            <div class="dropdown-content z-50 mt-2">
              <MenuList />
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
