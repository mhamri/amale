import { onCleanup, onMount } from 'solid-js';

const UNHANDLED = '[data-reveal]:not([data-reveal-visible]):not([data-reveal-pending])';
const PENDING = 'data-reveal-pending';
const VISIBLE = 'data-reveal-visible';

const STAGGER_MS = 40;
const STAGGER_MAX_MS = 80;

export default function Reveal() {
  onMount(() => {
    if (typeof IntersectionObserver !== 'function') return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let step = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          const element = entry.target as HTMLElement;
          element.style.setProperty('--reveal-delay', `${Math.min(step * STAGGER_MS, STAGGER_MAX_MS)}ms`);
          element.setAttribute(VISIBLE, '');
          element.removeAttribute(PENDING);
          step += 1;
        }
      },
      { threshold: 0 },
    );

    let frame = 0;
    const scan = () => {
      frame = 0;
      const fold = window.innerHeight;
      for (const element of document.querySelectorAll(UNHANDLED)) {
        if (element.getBoundingClientRect().top < fold) continue;
        element.setAttribute(PENDING, '');
        observer.observe(element);
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(scan);
    };

    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });

    const onReducedChange = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      observer.disconnect();
      mutations.disconnect();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      for (const element of document.querySelectorAll(`[${PENDING}]`)) element.removeAttribute(PENDING);
    };
    reduced.addEventListener('change', onReducedChange);

    scan();

    onCleanup(() => {
      observer.disconnect();
      mutations.disconnect();
      reduced.removeEventListener('change', onReducedChange);
      if (frame) cancelAnimationFrame(frame);
    });
  });

  return null;
}
