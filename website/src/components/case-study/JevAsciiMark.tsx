import { createSignal, onMount, onCleanup } from 'solid-js';
import {
  renderFrame,
  STILL_FRAME,
  REST_TILT_X,
  REST_TILT_Y,
  REST_SPIN,
  EM_WIDTH,
} from './jev-mark-frame.ts';

const FONT_SIZE = `calc(100cqw / ${(EM_WIDTH * 1.03).toFixed(2)})`;
const TILT_EASE = 0.14;
const TILT_RANGE_X = 0.6;
const TILT_RANGE_Y = 0.9;
const SCROLL_TURN = 0.003;
const DRAW_EPSILON = 5e-4;

export default function JevAsciiMark() {
  let wrapper: HTMLDivElement | undefined;
  const [frame, setFrame] = createSignal(STILL_FRAME);
  const [tilt, setTilt] = createSignal(`${REST_TILT_X.toFixed(3)},${REST_TILT_Y.toFixed(3)}`);
  const [spin, setSpin] = createSignal(REST_SPIN.toFixed(3));

  let media: MediaQueryList | undefined;
  let raf = 0;
  let running = false;
  let onScreen = false;
  let tiltX = REST_TILT_X;
  let tiltY = REST_TILT_Y;
  let spinY = REST_SPIN;
  let targetTiltX = REST_TILT_X;
  let targetTiltY = REST_TILT_Y;
  let drawnTiltX = NaN;
  let drawnTiltY = NaN;
  let drawnSpin = NaN;
  let lastScrollY = 0;

  const reduced = () => media?.matches ?? true;

  function drawPose() {
    if (
      Math.abs(tiltX - drawnTiltX) + Math.abs(tiltY - drawnTiltY) + Math.abs(spinY - drawnSpin) <
      DRAW_EPSILON
    ) {
      return;
    }
    drawnTiltX = tiltX;
    drawnTiltY = tiltY;
    drawnSpin = spinY;
    setFrame(renderFrame(tiltX, tiltY, spinY));
    setTilt(`${tiltX.toFixed(3)},${tiltY.toFixed(3)}`);
    setSpin(spinY.toFixed(3));
  }

  function tick() {
    if (!running || !onScreen || reduced()) return;
    tiltX += (targetTiltX - tiltX) * TILT_EASE;
    tiltY += (targetTiltY - tiltY) * TILT_EASE;
    drawPose();
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function rest() {
    targetTiltX = REST_TILT_X;
    targetTiltY = REST_TILT_Y;
  }

  function onPointerMove(event: PointerEvent) {
    if (reduced() || !wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    targetTiltX = REST_TILT_X + ny * TILT_RANGE_X;
    targetTiltY = nx * TILT_RANGE_Y;
  }

  function onPointerLeave() {
    if (!reduced()) rest();
  }

  function onScroll() {
    if (reduced()) return;
    spinY -= (window.scrollY - lastScrollY) * SCROLL_TURN;
    lastScrollY = window.scrollY;
  }

  function applyPreference() {
    if (reduced()) {
      stop();
      tiltX = REST_TILT_X;
      tiltY = REST_TILT_Y;
      spinY = REST_SPIN;
      rest();
      drawnTiltX = NaN;
      drawnTiltY = NaN;
      drawnSpin = NaN;
      drawPose();
    } else if (onScreen) {
      start();
    }
  }

  onMount(() => {
    media = window.matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', applyPreference);
    lastScrollY = window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? false;
        if (onScreen && !reduced()) start();
        else stop();
      },
      { threshold: 0 },
    );
    if (wrapper) observer.observe(wrapper);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (onScreen && !reduced()) start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    if (wrapper) {
      wrapper.addEventListener('pointermove', onPointerMove);
      wrapper.addEventListener('pointerleave', onPointerLeave);
    }

    onCleanup(() => {
      stop();
      observer.disconnect();
      media?.removeEventListener('change', applyPreference);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      wrapper?.removeEventListener('pointermove', onPointerMove);
      wrapper?.removeEventListener('pointerleave', onPointerLeave);
    });
  });

  return (
    <div
      ref={wrapper}
      data-jev-mark
      data-tilt={tilt()}
      data-spin={spin()}
      role="img"
      aria-label="Interactive ASCII rendering of the TypeSafe Jev mark: an isometric knot of hollow boxes extruded in depth"
      class="@container relative mx-auto w-full max-w-[28rem] select-none"
    >
      <pre
        aria-hidden="true"
        class="w-full overflow-hidden font-mono text-accent"
        style={{ 'font-size': FONT_SIZE, 'line-height': '1.1' }}
      >
        {frame()}
      </pre>
    </div>
  );
}
