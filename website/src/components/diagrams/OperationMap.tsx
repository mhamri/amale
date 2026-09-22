import { onCleanup, onMount } from 'solid-js';

/**
 * Operation map — the subject of the command reference page: every CLI
 * operation grouped by the stage of the run it serves.
 *
 * Static SVG first (stacked below `sm`, wide above), real `<text>` labels,
 * `role="img"` with an aria-label. The timeline starts after mount: the rail
 * dashes march and a highlight walks the six run stages, lighting the panels
 * that serve each stage. Reduced motion holds one static frame and follows
 * the query's `change` event; an IntersectionObserver and visibilitychange
 * pause the loop off screen and in hidden tabs; `onCleanup` releases it all.
 */

type Tone = 'primary' | 'secondary' | 'accent' | 'info' | 'dim';

const ringStroke: Record<Tone, string> = {
  primary: 'stroke-primary',
  secondary: 'stroke-secondary',
  accent: 'stroke-accent',
  info: 'stroke-info',
  dim: 'stroke-dim',
};

const fillTone: Record<Tone, string> = {
  primary: 'fill-primary',
  secondary: 'fill-secondary',
  accent: 'fill-accent',
  info: 'fill-info',
  dim: 'fill-dim',
};

function Flow(props: { d: string }) {
  return (
    <path
      d={props.d}
      class="fill-none stroke-primary"
      stroke-width="1.5"
      stroke-dasharray="6 6"
      data-flow=""
    />
  );
}

function Head(props: { points: string }) {
  return <polygon points={props.points} class="fill-primary" />;
}

function T(props: {
  x: number;
  y: number;
  s: number;
  f?: string;
  mono?: boolean;
  b?: boolean;
  mid?: boolean;
  children: string;
}) {
  return (
    <text
      x={props.x}
      y={props.y}
      font-size={String(props.s)}
      text-anchor={props.mid ? 'middle' : undefined}
      class={`${props.mono ? 'font-mono ' : ''}${props.b ? 'font-semibold ' : ''}${props.f ?? 'fill-dim'}`}
    >
      {props.children}
    </text>
  );
}

/** Wide variant: a panel of operations with its stage title. */
function Panel(props: { x: number; y: number; step: number; tone: Tone; title: string; ops: string[] }) {
  return (
    <g>
      <rect
        x={props.x}
        y={props.y}
        width={146}
        height={150}
        rx="10"
        class="fill-base-300 stroke-line"
        stroke-width="1"
      />
      <rect
        x={props.x}
        y={props.y}
        width={146}
        height={150}
        rx="10"
        class={`fill-none ${ringStroke[props.tone]}`}
        stroke-width="2"
        data-pulse={props.step}
        opacity={props.step === 0 ? '0.9' : '0'}
      />
      <T x={props.x + 12} y={props.y + 26} s={11.5} f={fillTone[props.tone]} b>
        {props.title}
      </T>
      {props.ops.map((op, i) => (
        <T x={props.x + 12} y={props.y + 50 + i * 17} s={10} mono>
          {op}
        </T>
      ))}
    </g>
  );
}

/** Rail stop: a stage of the run. */
function Stop(props: { x: number; y: number; w: number; h: number; step: number; tone: Tone; label: string }) {
  return (
    <g>
      <rect
        x={props.x}
        y={props.y}
        width={props.w}
        height={props.h}
        rx="10"
        class="fill-base-300 stroke-line"
        stroke-width="1"
      />
      <rect
        x={props.x}
        y={props.y}
        width={props.w}
        height={props.h}
        rx="10"
        class={`fill-none ${ringStroke[props.tone]}`}
        stroke-width="2"
        data-pulse={props.step}
        opacity={props.step === 0 ? '0.9' : '0'}
      />
      <T x={props.x + props.w / 2} y={props.y + props.h / 2 + 5} s={12.5} f="fill-base-content" b mid>
        {props.label}
      </T>
    </g>
  );
}

export default function OperationMap() {
  let panel!: HTMLDivElement;

  onMount(() => {
    const flows = Array.from(panel.querySelectorAll<SVGGeometryElement>('[data-flow]'));
    const pulses = Array.from(panel.querySelectorAll<SVGElement>('[data-pulse]'));
    const steps = pulses.map((el) => Number(el.getAttribute('data-pulse')));
    const stepCount = Math.max(...steps) + 1;
    const offsets = Array.from({ length: 12 }, (_, i) => String(-i));
    const STEP_SECONDS = 1.2;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');

    let raf = 0;
    let origin = 0;
    let onScreen = true;

    const renderStatic = () => {
      for (const el of flows) el.setAttribute('stroke-dashoffset', '0');
      for (let i = 0; i < pulses.length; i += 1) {
        pulses[i].setAttribute('opacity', steps[i] === 0 ? '0.9' : '0');
      }
    };

    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const tick = (now: number) => {
      const t = (now - origin) / 1000;
      const offset = offsets[Math.floor((t * 24) % 12)];
      for (const el of flows) el.setAttribute('stroke-dashoffset', offset);
      const step = Math.floor(t / STEP_SECONDS) % stepCount;
      for (let i = 0; i < pulses.length; i += 1) {
        pulses[i].setAttribute('opacity', steps[i] === step ? '0.9' : '0');
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf || media.matches || !onScreen || document.hidden) return;
      origin = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const applyMotion = () => {
      if (media.matches) {
        stop();
        renderStatic();
      } else {
        start();
      }
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true;
        if (onScreen) start();
        else stop();
      },
      { threshold: 0.05 },
    );

    observer.observe(panel);
    media.addEventListener('change', applyMotion);
    document.addEventListener('visibilitychange', onVisibility);

    if (media.matches) renderStatic();
    else start();

    onCleanup(() => {
      stop();
      observer.disconnect();
      media.removeEventListener('change', applyMotion);
      document.removeEventListener('visibilitychange', onVisibility);
    });
  });

  return (
    <figure class="overflow-hidden rounded-box border border-line bg-base-200 shadow-rest">
      <div ref={panel} class="aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[16/9]">
        <svg
          viewBox="0 0 288 216"
          role="img"
          aria-label="Operation map: CLI operations grouped by stage — plan, delegate and execute, review, decide, operate and diagnostics"
          class="size-full sm:hidden"
          preserveAspectRatio="xMidYMid meet"
        >
          <Stop x={3} y={6} w={42} h={16} step={0} tone="primary" label="plan" />
          <Stop x={51} y={6} w={42} h={16} step={1} tone="primary" label="delegate" />
          <Stop x={99} y={6} w={42} h={16} step={2} tone="primary" label="execute" />
          <Stop x={147} y={6} w={42} h={16} step={3} tone="secondary" label="review" />
          <Stop x={195} y={6} w={42} h={16} step={4} tone="accent" label="decide" />
          <Stop x={243} y={6} w={42} h={16} step={5} tone="info" label="operate" />
          <Flow d="M 46 14 H 50" />
          <Flow d="M 94 14 H 98" />
          <Flow d="M 142 14 H 146" />
          <Flow d="M 190 14 H 194" />
          <Flow d="M 238 14 H 242" />

          <T x={6} y={36} s={8.5} f="fill-primary" b>plan</T>
          <T x={44} y={36} s={8} mono>plan · amend · invalidate · record-decision</T>
          <T x={6} y={55} s={8.5} f="fill-primary" b>build</T>
          <T x={44} y={55} s={8} mono>delegate · delegate-batch · claim · route</T>
          <T x={44} y={66} s={8} mono>worker · check · result</T>
          <T x={6} y={85} s={8.5} f="fill-secondary" b>review</T>
          <T x={44} y={85} s={8} mono>reviewer · review-packet · review-check</T>
          <T x={44} y={96} s={8} mono>review · repair · accept · integrated</T>
          <T x={44} y={107} s={8} mono>finish · health</T>
          <T x={6} y={126} s={8.5} f="fill-accent" b>decide</T>
          <T x={44} y={126} s={8} mono>decide · decide-batch · host-decision · pools</T>
          <T x={44} y={137} s={8} mono>catalog · host-exception</T>
          <T x={6} y={156} s={8.5} f="fill-info" b>operate</T>
          <T x={44} y={156} s={8} mono>start · list · status · next · diagnose · resume</T>
          <T x={44} y={167} s={8} mono>configure · block · requeue · unlock · preflight</T>
          <T x={44} y={178} s={8} mono>save · artifact · fingerprint · host-action</T>
          <T x={44} y={189} s={8} mono>diagnostic-export · doctor · install · html</T>
          <T x={44} y={200} s={8} mono>effort-configure … effort-reconcile (5)</T>
        </svg>

        <svg
          viewBox="0 0 800 450"
          role="img"
          aria-label="Operation map: CLI operations grouped by stage — plan the graph, delegate chunks, run a chunk, independent review, repair and accept, start and inspect, decide and route, configure and guard, evidence, bootstrap"
          class="hidden size-full sm:block"
          preserveAspectRatio="xMidYMid meet"
        >
          <Stop x={19} y={36} w={112} h={44} step={0} tone="primary" label="plan" />
          <Stop x={149} y={36} w={112} h={44} step={1} tone="primary" label="delegate" />
          <Stop x={279} y={36} w={112} h={44} step={2} tone="primary" label="execute" />
          <Stop x={409} y={36} w={112} h={44} step={3} tone="secondary" label="review" />
          <Stop x={539} y={36} w={112} h={44} step={4} tone="accent" label="decide" />
          <Stop x={669} y={36} w={112} h={44} step={5} tone="info" label="operate" />

          <Flow d="M 135 58 H 143" />
          <Head points="149,58 141,54 141,62" />
          <Flow d="M 265 58 H 273" />
          <Head points="279,58 271,54 271,62" />
          <Flow d="M 395 58 H 403" />
          <Head points="409,58 401,54 401,62" />
          <Flow d="M 525 58 H 533" />
          <Head points="539,58 531,54 531,62" />
          <Flow d="M 655 58 H 663" />
          <Head points="669,58 661,54 661,62" />

          <Panel x={15} y={112} step={0} tone="primary" title="plan the graph"
            ops={['plan', 'amend', 'invalidate', 'record-decision']} />
          <Panel x={171} y={112} step={1} tone="primary" title="delegate chunks"
            ops={['delegate', 'delegate-batch']} />
          <Panel x={327} y={112} step={2} tone="primary" title="run a chunk"
            ops={['claim', 'route', 'worker', 'check', 'result']} />
          <Panel x={483} y={112} step={3} tone="secondary" title="independent review"
            ops={['reviewer', 'review-packet', 'review-check', 'review']} />
          <Panel x={639} y={112} step={3} tone="secondary" title="repair & accept"
            ops={['repair', 'accept', 'integrated', 'finish']} />
          <Panel x={15} y={286} step={5} tone="info" title="start & inspect"
            ops={['start', 'list', 'status', 'next', 'diagnose', 'resume']} />
          <Panel x={171} y={286} step={4} tone="accent" title="decide & route"
            ops={['decide', 'decide-batch', 'host-decision', 'pools', 'catalog']} />
          <Panel x={327} y={286} step={5} tone="info" title="configure & guard"
            ops={['configure', 'block', 'requeue', 'unlock', 'host-exception', 'preflight']} />
          <Panel x={483} y={286} step={5} tone="info" title="evidence"
            ops={['save', 'artifact', 'fingerprint', 'host-action', 'diagnostic-export']} />
          <Panel x={639} y={286} step={5} tone="info" title="bootstrap & effort"
            ops={['doctor', 'install', 'html', 'effort-* (5 operations)']} />
        </svg>
      </div>
      <figcaption class="border-t border-line px-4 py-3 text-sm text-dim">
        The operation map: every CLI operation grouped by the stage of the run it serves — planning,
        delegation and execution, review and repair, decisions, and the operations that inspect,
        configure and close a run.
      </figcaption>
    </figure>
  );
}