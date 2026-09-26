import { onCleanup, onMount, type JSX } from 'solid-js';

/**
 * Review and repair loop — the subject of the review-and-recovery page: the
 * worker's checks, independent other-family review, the repair escalation
 * from Flash to Kimi to host takeover, and resume from the disk checkpoint.
 *
 * Static SVG first (stacked below `sm`, wide above), real `<text>` labels,
 * `role="img"` with an aria-label. The timeline starts after mount: dashes
 * march along the loop and a highlight walks worker → checks → review →
 * repair ladder → accept → checkpoint → resume. Reduced motion holds one
 * static frame and follows the query's `change` event; an IntersectionObserver
 * and visibilitychange pause the loop off screen and in hidden tabs;
 * `onCleanup` releases it all.
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

function Box(props: {
  x: number;
  y: number;
  w: number;
  h: number;
  step?: number;
  tone?: Tone;
  children?: JSX.Element;
}) {
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
      {props.step !== undefined && (
        <rect
          x={props.x}
          y={props.y}
          width={props.w}
          height={props.h}
          rx="10"
          class={`fill-none ${ringStroke[props.tone ?? 'primary']}`}
          stroke-width="2"
          data-pulse={props.step}
          opacity={props.step === 0 ? '0.9' : '0'}
        />
      )}
      {props.children}
    </g>
  );
}

function Flow(props: { d: string; tone?: Tone }) {
  return (
    <path
      d={props.d}
      class={`fill-none ${ringStroke[props.tone ?? 'primary']}`}
      stroke-width="1.5"
      stroke-dasharray="6 6"
      data-flow=""
    />
  );
}

function Head(props: { points: string; tone?: Tone }) {
  return <polygon points={props.points} class={fillTone[props.tone ?? 'primary']} />;
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

export default function ReviewLoop() {
  let panel!: HTMLDivElement;

  onMount(() => {
    const flows = Array.from(panel.querySelectorAll<SVGGeometryElement>('[data-flow]'));
    const pulses = Array.from(panel.querySelectorAll<SVGElement>('[data-pulse]'));
    const steps = pulses.map((el) => Number(el.getAttribute('data-pulse')));
    const stepCount = Math.max(...steps) + 1;
    const offsets = Array.from({ length: 12 }, (_, i) => String(-i));
    const STEP_SECONDS = 1.0;
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
          aria-label="Review and repair loop: worker, checks, independent cross-family review, accept, repair escalation from flash to Kimi to a final host takeover accepted on its checks, checkpoint on disk, resume"
          class="size-full sm:hidden"
          preserveAspectRatio="xMidYMid meet"
        >
          <Box x={8} y={8} w={128} h={42} step={0} tone="primary">
            <T x={18} y={32} s={11} f="fill-base-content" b>worker</T>
            <T x={18} y={43} s={8}>routed family · writes</T>
          </Box>
          <Box x={8} y={62} w={128} h={42} step={1} tone="primary">
            <T x={18} y={86} s={11} f="fill-base-content" b>checks</T>
            <T x={18} y={97} s={8}>registered · receipts</T>
          </Box>
          <Box x={8} y={116} w={128} h={42} step={2} tone="secondary">
            <T x={18} y={140} s={11} f="fill-secondary" b>reviewer</T>
            <T x={18} y={151} s={8}>other model family</T>
          </Box>
          <Box x={8} y={170} w={128} h={36} step={6} tone="secondary">
            <T x={18} y={190} s={10.5} f="fill-secondary" b>accept</T>
            <T x={18} y={200} s={8}>all covered</T>
          </Box>
          <Box x={152} y={8} w={128} h={42} step={3} tone="primary">
            <T x={162} y={32} s={11} f="fill-base-content" b mono>flash ×2</T>
            <T x={162} y={43} s={8}>two repair cycles</T>
          </Box>
          <Box x={152} y={62} w={128} h={42} step={4} tone="primary">
            <T x={162} y={86} s={11} f="fill-base-content" b mono>kimi ×1</T>
            <T x={162} y={97} s={8}>deeper diagnosis</T>
          </Box>
          <Box x={152} y={116} w={128} h={42} step={5} tone="primary">
            <T x={162} y={140} s={11} f="fill-base-content" b>host</T>
            <T x={162} y={151} s={8}>final · checks only</T>
          </Box>
          <Box x={152} y={170} w={128} h={36} step={7} tone="accent">
            <T x={162} y={190} s={10.5} f="fill-accent" b>resume</T>
            <T x={162} y={200} s={8}>invoke again · same run</T>
          </Box>

          <Flow d="M 72 50 V 58" />
          <Head points="72,62 68,55 76,55" />
          <Flow d="M 72 104 V 112" />
          <Head points="72,116 68,109 76,109" />
          <Flow d="M 72 158 V 166" tone="secondary" />
          <Head points="72,170 68,163 76,163" tone="secondary" />
          <Flow d="M 136 137 H 145 V 30 H 148" />
          <Head points="152,30 146,26 146,34" />
          <Flow d="M 216 50 V 58" />
          <Head points="216,62 212,55 220,55" />
          <Flow d="M 216 104 V 112" />
          <Head points="216,116 212,109 220,109" />
          <Flow d="M 280 29 H 284 V 83" />
          <Flow d="M 280 83 H 284 V 212 H 4 V 29 H 6" />
          <Head points="8,29 2,25 2,33" />
          <Flow d="M 152 150 H 146 V 188 H 140" tone="secondary" />
          <Head points="136,188 142,184 142,192" tone="secondary" />
        </svg>

        <svg
          viewBox="0 0 800 450"
          role="img"
          aria-label="Review and repair loop: worker checks and an independent reviewer from a different model family gate acceptance; blocking findings escalate repair from flash to Kimi, whose repairs rerun the worker, and then to the host, whose fix is final and accepted on its checks; a checkpointed run resumes from disk"
          class="hidden size-full sm:block"
          preserveAspectRatio="xMidYMid meet"
        >
          <Box x={18} y={40} w={170} h={96} step={0} tone="primary">
            <T x={32} y={86} s={15.5} f="fill-base-content" b>worker</T>
            <T x={32} y={110} s={10}>routed model family</T>
            <T x={32} y={126} s={10}>writes the change</T>
          </Box>
          <Box x={240} y={40} w={150} h={96} step={1} tone="primary">
            <T x={254} y={86} s={15} f="fill-base-content" b>checks</T>
            <T x={254} y={110} s={10}>registered · executable</T>
            <T x={254} y={126} s={10}>receipts on disk</T>
          </Box>
          <Box x={450} y={40} w={210} h={104} step={2} tone="secondary">
            <T x={464} y={86} s={14} f="fill-secondary" b>independent review</T>
            <T x={464} y={108} s={10}>other model family · read-only</T>
            <T x={464} y={124} s={10}>coverage entry per obligation</T>
            <T x={464} y={140} s={9.5}>findings need scenario + evidence</T>
          </Box>
          <Box x={680} y={40} w={100} h={96} step={6} tone="secondary">
            <T x={730} y={88} s={14} f="fill-secondary" b mid>accept</T>
            <T x={730} y={110} s={9.5} mid>all covered</T>
          </Box>
          <Box x={660} y={200} w={120} h={56} step={3} tone="primary">
            <T x={672} y={226} s={12} f="fill-base-content" b mono>flash ×2</T>
            <T x={672} y={244} s={9.5}>two repair cycles</T>
          </Box>
          <Box x={660} y={284} w={120} h={56} step={4} tone="primary">
            <T x={672} y={310} s={12} f="fill-base-content" b mono>kimi ×1</T>
            <T x={672} y={328} s={9.5}>deeper diagnosis</T>
          </Box>
          <Box x={660} y={368} w={120} h={56} step={5} tone="primary">
            <T x={672} y={394} s={11.5} f="fill-base-content" b mono>host takeover</T>
            <T x={672} y={412} s={9.5}>final · checks only</T>
          </Box>
          <Box x={240} y={300} w={180} h={96} step={7} tone="dim">
            <T x={254} y={346} s={12} f="fill-base-content" b mono>.amaleh run state</T>
            <T x={254} y={368} s={10}>revisions + artifacts</T>
            <T x={254} y={384} s={10}>retained across sessions</T>
          </Box>
          <Box x={18} y={300} w={150} h={96} step={7} tone="accent">
            <T x={32} y={346} s={14} f="fill-accent" b>resume</T>
            <T x={32} y={368} s={10}>invoke again</T>
            <T x={32} y={384} s={10}>same checkpoint</T>
          </Box>

          <Flow d="M 188 88 H 234" />
          <Head points="240,88 232,84 232,92" />
          <Flow d="M 390 88 H 444" tone="secondary" />
          <Head points="450,88 442,84 442,92" tone="secondary" />
          <Flow d="M 660 88 H 674" tone="secondary" />
          <Head points="680,88 672,84 672,92" tone="secondary" />
          <Flow d="M 555 144 C 555 210 600 230 654 230" />
          <Head points="660,230 652,226 652,236" />
          <T x={600} y={184} s={10} mid>blocking finding</T>
          <Flow d="M 720 256 V 278" />
          <Head points="720,284 716,277 724,277" />
          <Flow d="M 720 340 V 362" />
          <Head points="720,368 716,361 724,361" />
          <Flow d="M 660 246 H 440 V 312" />
          <Flow d="M 660 312 H 440 V 438 H 8 V 88 H 12" />
          <Head points="18,88 11,84 11,92" />
          <T x={300} y={432} s={10} mid>flash and Kimi repairs rerun the worker</T>
          <Flow d="M 780 396 H 792 V 88 H 786" tone="secondary" />
          <Head points="780,88 788,84 788,92" tone="secondary" />
          <Flow d="M 240 348 H 174" tone="accent" />
          <Head points="168,348 176,344 176,352" tone="accent" />
          <T x={204} y={338} s={9} mid>invoke again</T>
          <Flow d="M 93 300 V 146" tone="accent" />
          <Head points="93,136 89,143 97,143" tone="accent" />
        </svg>
      </div>
      <figcaption class="border-t border-line px-4 py-3 text-sm text-dim">
        The review and repair loop: the worker's checks and an independent reviewer from a different
        model family gate acceptance; blocking findings escalate repair through flash, then Kimi,
        then the host, whose fix is final and accepted on its checks alone, and the checkpointed run
        resumes from disk on the next invocation.
      </figcaption>
    </figure>
  );
}