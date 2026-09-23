import { onCleanup, onMount } from 'solid-js';

/** Marked elements the stylesheet has not animated and script has not held. */
const UNHANDLED = '[data-reveal]:not([data-reveal-visible]):not([data-reveal-pending])';
const PENDING = 'data-reveal-pending';
const VISIBLE = 'data-reveal-visible';

/** Gap between two elements revealed in the same batch. */
const STAGGER_MS = 40;
/** Ceiling on that gap, so one entrance never runs past 700ms in total. */
const STAGGER_MAX_MS = 80;

/**
 * Reveal — holds the `data-reveal` elements that are below the fold and
 * releases each one as it scrolls into view. The shell mounts it once, for
 * every route.
 *
 * The stylesheet owns the entrance itself (see "Entrance motion" in
 * style.css): every marked element that script leaves alone fades and rises
 * in on load, from first paint, with no help from this component. This
 * component only defers the ones the reader cannot see yet, and it never
 * touches an element that is already on screen — re-hiding one would be a
 * visible flicker.
 *
 * Nothing here runs with JavaScript disabled (the stylesheet's hide rule is
 * scoped to `scripting: enabled`, so everything is visible without it), and
 * nothing here runs under `prefers-reduced-motion: reduce`.
 */
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
          // Removing the hold releases the stylesheet's reveal, which starts
          // now that the element is on screen.
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

    // Route content arrives through the router rather than through this
    // component, so watch the document for new marked elements instead of
    // binding to one route's markup.
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });

    const onReducedChange = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      observer.disconnect();
      mutations.disconnect();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      // The stylesheet stops hiding held elements under reduced motion; drop
      // the hold so the attribute cannot outlive the preference.
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