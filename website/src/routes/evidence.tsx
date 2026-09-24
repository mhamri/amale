import { Meta } from '@solidjs/meta';
import PageMeta from '../components/PageMeta';
import { asset } from '../lib/paths';

export default function EvidenceRedirect() {
  const target = asset('case-study/');
  return (
    <>
      <PageMeta title="Redirecting — Amaleh" description="This page has moved to the case study." />
      <Meta http-equiv="refresh" content={`0; url=${target}`} />
      <main id="main">
        <section class="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <h1 class="font-display text-hero font-semibold tracking-tight">Redirecting</h1>
          <p class="mt-5 text-base leading-relaxed text-dim max-w-prose">
            This page has moved. You are being redirected to the{' '}
            <a class="link link-hover text-primary" href={target}>case study</a>.
          </p>
        </section>
      </main>
    </>
  );
}