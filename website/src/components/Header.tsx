import { asset } from '../lib/paths';
import Brand from './Brand';

const primaryLinks = [
  { label: 'Overview', href: asset('') },
  { label: 'Docs', href: asset('docs/') },
  { label: 'Case study', href: asset('case-study/') },
];

const github = { label: 'GitHub', href: 'https://github.com/mhamri/amaleh' };

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
