import { onCleanup, onMount, type JSX } from 'solid-js';

/**
 * Install and first-run sequence — the subject of the getting-started page.
 *
 * The markup is a static SVG first: it renders complete and meaningful with
 * no JavaScript (one stacked variant below `sm`, one wide variant at and
 * above it), with every label as real `<text>`. After mount a small timeline
 * marches the connector dashes and walks a highlight through the six stages.
 * Motion starts only after mount, holds one static frame under
 * prefers-reduced-motion (and reacts to that query's `change` event), pauses
 * through an IntersectionObserver off screen and through visibilitychange
 * when the tab is hidden, and tears everything down in `onCleanup`.
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

/** Connector: dashed so the marching animation reads as flow direction. */
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

export default function InstallSequence() {
  let panel!: HTMLDivElement;

  onMount(() => {
    const flows = Array.from(panel.querySelectorAll<SVGGeometryElement>('[data-flow]'));
    const pulses = Array.from(panel.querySelectorAll<SVGElement>('[data-pulse]'));
    const steps = pulses.map((el) => Number(el.getAttribute('data-pulse')));
    const stepCount = Math.max(...steps) + 1;
    const offsets = Array.from({ length: 12 }, (_, i) => String(-i));
    const STEP_SECONDS = 1.1;
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
          aria-label="Install and first-run sequence: doctor, install, preflight, invoke, run checkpoint, resume"
          class="size-full sm:hidden"
          preserveAspectRatio="xMidYMid meet"
        >
          <Box x={8} y={8} w={124} h={52} step={0} tone="primary">
            <T x={20} y={28} s={10} f="fill-primary" mono b>1</T>
            <T x={20} y={44} s={11.5} f="fill-base-content" b>doctor</T>
            <T x={20} y={55} s={8}>local check</T>
          </Box>
          <Box x={156} y={8} w={124} h={52} step={1} tone="primary">
            <T x={168} y={28} s={10} f="fill-primary" mono b>2</T>
            <T x={168} y={44} s={11.5} f="fill-base-content" b>install</T>
            <T x={168} y={55} s={8}>links skill dirs</T>
          </Box>
          <Box x={8} y={78} w={124} h={52} step={2} tone="primary">
            <T x={20} y={98} s={10} f="fill-primary" mono b>3</T>
            <T x={20} y={114} s={11.5} f="fill-base-content" b>preflight</T>
            <T x={20} y={125} s={8}>credential + Jev</T>
          </Box>
          <Box x={156} y={78} w={124} h={52} step={3} tone="primary">
            <T x={168} y={98} s={10} f="fill-primary" mono b>4</T>
            <T x={168} y={114} s={11.5} f="fill-base-content" b mono>invoke /amale</T>
            <T x={168} y={125} s={8}>state the outcome</T>
          </Box>
          <Box x={8} y={148} w={124} h={52} step={4} tone="dim">
            <T x={20} y={168} s={10} f="fill-primary" mono b>5</T>
            <T x={20} y={184} s={11} f="fill-base-content" b>run state on disk</T>
            <T x={20} y={195} s={8} mono>.amale/ checkpoint</T>
          </Box>
          <Box x={156} y={148} w={124} h={52} step={5} tone="accent">
            <T x={168} y={168} s={10} f="fill-primary" mono b>6</T>
            <T x={168} y={184} s={11.5} f="fill-accent" b>resume</T>
            <T x={168} y={195} s={8}>invoke again</T>
          </Box>

          <Flow d="M 134 34 H 149" />
          <Head points="156,34 149,30 149,38" />
          <Flow d="M 218 60 V 66 H 70 V 71" />
          <Head points="70,78 66,71 74,71" />
          <Flow d="M 134 104 H 149" />
          <Head points="156,104 149,100 149,108" />
          <Flow d="M 218 130 V 136 H 70 V 142" />
          <Head points="70,148 66,141 74,141" />
          <Flow d="M 134 174 H 149" />
          <Head points="156,174 149,170 149,178" />
          <Flow d="M 218 148 V 136" tone="accent" />
          <Head points="218,130 214,137 222,137" tone="accent" />
        </svg>

        <svg
          viewBox="0 0 800 450"
          role="img"
          aria-label="Install and first-run sequence: doctor, install, preflight, invoke the skill, run state checkpointed on disk, resume"
          class="hidden size-full sm:block"
          preserveAspectRatio="xMidYMid meet"
        >
          <Box x={18} y={36} w={170} h={88} step={0} tone="primary">
            <T x={32} y={62} s={12} f="fill-primary" mono b>1</T>
            <T x={32} y={88} s={15.5} f="fill-base-content" b>doctor</T>
            <T x={32} y={110} s={11}>local check · no network</T>
          </Box>
          <Box x={214} y={36} w={170} h={88} step={1} tone="primary">
            <T x={228} y={62} s={12} f="fill-primary" mono b>2</T>
            <T x={228} y={88} s={15.5} f="fill-base-content" b>install</T>
            <T x={228} y={110} s={11}>links skill directories</T>
          </Box>
          <Box x={410} y={36} w={170} h={88} step={2} tone="primary">
            <T x={424} y={62} s={12} f="fill-primary" mono b>3</T>
            <T x={424} y={88} s={15.5} f="fill-base-content" b>preflight</T>
            <T x={424} y={110} s={11}>credential + Jev shape</T>
          </Box>
          <Box x={606} y={36} w={170} h={88} step={3} tone="primary">
            <T x={620} y={62} s={12} f="fill-primary" mono b>4</T>
            <T x={620} y={88} s={14.5} f="fill-base-content" b mono>invoke /amale</T>
            <T x={620} y={110} s={11}>state the outcome</T>
          </Box>

          <Box x={140} y={260} w={220} h={88} step={4} tone="dim">
            <T x={154} y={312} s={15} f="fill-base-content" b>run state on disk</T>
            <T x={154} y={334} s={10.5} mono>.amale/ revisions + artifacts</T>
          </Box>
          <Box x={500} y={260} w={220} h={88} step={5} tone="accent">
            <T x={514} y={312} s={15} f="fill-accent" b>resume</T>
            <T x={514} y={334} s={11}>invoke again · same checkpoint</T>
          </Box>

          <Flow d="M 190 80 H 206" />
          <Head points="214,80 206,76 206,84" />
          <Flow d="M 386 80 H 402" />
          <Head points="410,80 402,76 402,84" />
          <Flow d="M 582 80 H 598" />
          <Head points="606,80 598,76 598,84" />
          <Flow d="M 691 124 V 304 H 366" />
          <Head points="360,304 368,300 368,308" />
          <T x={528} y={290} s={11} mid>checkpoint written during the run</T>
          <Flow d="M 366 304 H 488" />
          <Head points="494,304 486,300 486,308" />
          <T x={427} y={292} s={11} mid>invoke again</T>
          <Flow d="M 610 260 C 610 190 655 180 655 134" tone="accent" />
          <Head points="655,124 651,132 659,132" tone="accent" />
          <T x={598} y={208} s={11} mid>same run · no old chat</T>

          <T x={400} y={414} s={12} mid>
            no background scheduler — a closed run continues on the next invocation
          </T>
        </svg>
      </div>
      <figcaption class="border-t border-line px-4 py-3 text-sm text-dim">
        The install and first-run sequence: doctor, install and preflight prepare the machine and
        credential, then invoking the skill starts a run that checkpoints to{' '}
        <span class="font-mono">.amale</span> and resumes when invoked again.
      </figcaption>
    </figure>
  );
}