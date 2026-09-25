import { createSignal, onMount, Show } from 'solid-js';
import { inConsentTimeZone, setConsentChoice, storedConsentChoice, type ConsentChoice } from '../lib/consent';

export const [consentBannerOpen, setConsentBannerOpen] = createSignal(false);

export default function ConsentBanner() {
  onMount(() => {
    if (inConsentTimeZone() && !storedConsentChoice()) setConsentBannerOpen(true);
  });

  const choose = (choice: ConsentChoice) => {
    setConsentChoice(choice);
    setConsentBannerOpen(false);
  };

  return (
    <Show when={consentBannerOpen()}>
      <div
        data-consent-banner
        role="region"
        aria-label="Cookie consent"
        class="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-base-200 shadow-floating"
      >
        <div class="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p class="max-w-prose text-sm leading-relaxed text-dim">
            This site uses Google Tag Manager and X to measure visits and ads.
          </p>
          <div class="flex flex-wrap gap-3">
            <button type="button" class="btn btn-outline btn-sm border-line text-base-content" onClick={() => choose('granted')}>
              Accept
            </button>
            <button type="button" class="btn btn-outline btn-sm border-line text-base-content" onClick={() => choose('denied')}>
              Reject
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
