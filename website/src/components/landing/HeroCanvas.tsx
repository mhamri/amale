import { onCleanup, onMount } from 'solid-js';
import { MODELS, type ModelId } from '../../lib/models';
import { asset } from '../../lib/paths';

type Role = 'coordinator' | 'worker' | 'jev' | 'review';

type SceneNode = {
  x: number;
  y: number;
  r: number;
  role: Role;
  /** Rendered only for model nodes: the identity layer labels models, while
   * the coordinator and reviewer stay anonymous dim anchors whose roles the
   * aria-label and the topology diagram carry. */
  label?: string;
  /** Set when the node is a routed model and wears a logo tile. */
  model?: ModelId;
};
type SceneLink = { from: number; to: number; role: Role; phase: number };

const DESIGN_WIDTH = 16;
const DESIGN_HEIGHT = 9;

// One tile size and shape for every model node, whether it carries a vendor
// mark or a monogram.
const TILE = { side: 0.72, half: 0.36, radius: 0.18 };

// The scene is a full-bleed background for copy that reads top-left, so the
// crisp identity layer — the model tiles and their labels — gathers in the
// lower right, below the headline zone and right of the prose measure. The
// coordinator and the reviewer are dim glows, not labelled boxes.
const NODES: SceneNode[] = [
  { x: 4.3, y: 4.5, r: 0.85, role: 'coordinator' },
  // Worker models — routed cheap models that receive chunks from the coordinator.
  { x: 11.0, y: 5.2, r: 0.44, role: 'worker', label: 'DeepSeek', model: 'deepseek' },
  { x: 13.6, y: 5.2, r: 0.44, role: 'worker', label: 'GLM', model: 'glm' },
  { x: 11.0, y: 7.05, r: 0.44, role: 'worker', label: 'MiMo', model: 'mimo' },
  { x: 13.6, y: 7.05, r: 0.44, role: 'worker', label: 'Solar', model: 'solar' },
  // Jev — orchestration model for bounded questions from workers.
  { x: 8.3, y: 7.7, r: 0.42, role: 'jev', label: 'Jev', model: 'jev' },
  // Reviewer hosts — each finished chunk is reviewed by a different model
  // family. Anthropic and OpenAI wear identity tiles, so they sit on the
  // lower row with the other labelled models: their marks paint their own
  // light fills (Anthropic's tan square, OpenAI's light tile surface), which
  // must never sit under the copy. The anonymous reviewer is a dim glow and
  // can stay higher.
  { x: 11.5, y: 1.35, r: 0.42, role: 'review' },
  { x: 9.4, y: 7.7, r: 0.42, role: 'review', label: 'Anthropic', model: 'anthropic' },
  { x: 15.5, y: 7.7, r: 0.42, role: 'review', label: 'OpenAI', model: 'openai' },
  // Kimi — escalation model via Jev. Its mark paints a large light monogram,
  // so it stays right of the prose measure with the other labelled tiles.
  { x: 12.3, y: 8.0, r: 0.40, role: 'worker', label: 'Kimi', model: 'kimi' },
];

const LINKS: SceneLink[] = [
  // Coordinator distributes chunks to four worker models.
  { from: 0, to: 1, role: 'coordinator', phase: 0 },
  { from: 0, to: 2, role: 'coordinator', phase: 0.26 },
  { from: 0, to: 3, role: 'coordinator', phase: 0.52 },
  { from: 0, to: 4, role: 'coordinator', phase: 0.78 },
  // Workers put bounded questions to Jev.
  { from: 2, to: 5, role: 'jev', phase: 0.14 },
  { from: 3, to: 5, role: 'jev', phase: 0.64 },
  // Jev escalates to Kimi when needed.
  { from: 5, to: 9, role: 'jev', phase: 0.38 },
  // Each finished chunk is reviewed by a different model family.
  { from: 1, to: 6, role: 'review', phase: 0.42 },
  { from: 4, to: 6, role: 'review', phase: 0.92 },
  { from: 1, to: 7, role: 'review', phase: 0.68 },
  { from: 3, to: 8, role: 'review', phase: 0.18 },
  // Accepted chunks travel back to the coordinator.
  { from: 6, to: 0, role: 'review', phase: 0.58 },
  { from: 7, to: 0, role: 'review', phase: 0.82 },
  { from: 8, to: 0, role: 'review', phase: 0.34 },
];

const NODE_COUNT = NODES.length;
const LINK_COUNT = LINKS.length;

const ARIA_LABEL =
  'The coordinator sends chunks of work out to routed worker models — DeepSeek, GLM, MiMo, Solar and Kimi. ' +
  'Workers put bounded questions to Jev, a different model family (Anthropic, OpenAI or the anonymous reviewer) ' +
  'reviews each finished chunk, and accepted chunks travel back to the coordinator.';

const ROLE_VARIABLE: Record<Role, string> = {
  coordinator: '--color-primary',
  worker: '--color-secondary',
  jev: '--color-accent',
  review: '--color-secondary',
};

// Every hue the scene can paint a node with: the role hues plus each model's
// routed hue from the identity list.
// Extract the bare custom-property name from a var(--color-*) expression so
// the palette lookup does not double-wrap in var().
const bareVar = (v: string) => v.replace(/^var\(/, '').replace(/\)$/, '');

const HUE_VARIABLES = [
  ...new Set([
    ...Object.values(ROLE_VARIABLE),
    ...Object.values(MODELS).map((m) => bareVar(m.hue)),
  ]),
];
const SCENE_VARIABLES = ['--color-base-100', '--color-line', ...HUE_VARIABLES];

// A model node glows in its own routed hue; the coordinator and the reviewer
// keep their role hues. Returns a bare custom-property name (e.g.
// '--color-secondary') so consumers can wrap it in var() themselves.
const nodeHue = (node: SceneNode) =>
  bareVar(node.model ? MODELS[node.model].hue : ROLE_VARIABLE[node.role]);

const VERTEX_SOURCE = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

// The design box is fitted inside the canvas exactly the way SVG
// preserveAspectRatio "xMidYMid meet" fits a viewBox, so the shader and the
// fallback SVG put every node, tile and label in the same place at every
// aspect ratio.
//
// The hero scene is a full-bleed background: the headline and body copy sit
// on top of it, so every additive glow is held far below the luminance that
// would cost the text its documented contrast ratios — a packet, its rail and
// a node ring together stay under half the AA threshold for dim body copy.
const FRAGMENT_SOURCE = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uBase;
uniform vec3 uLine;
uniform vec2 uNode[${NODE_COUNT}];
uniform float uNodeRadius[${NODE_COUNT}];
uniform vec3 uNodeColor[${NODE_COUNT}];
uniform vec4 uLink[${LINK_COUNT}];
uniform vec3 uLinkColor[${LINK_COUNT}];
uniform float uLinkPhase[${LINK_COUNT}];

float segmentDistance(vec2 p, vec2 a, vec2 b){
  vec2 ab = b - a;
  float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  return length(p - (a + ab * t));
}

float glow(float d, float sigma){
  return exp(-(d * d) / (2.0 * sigma * sigma));
}

void main(){
  float scale = min(uRes.x / ${DESIGN_WIDTH}.0, uRes.y / ${DESIGN_HEIGHT}.0);
  vec2 inset = (uRes - vec2(${DESIGN_WIDTH}.0, ${DESIGN_HEIGHT}.0) * scale) * 0.5;
  vec2 p = (gl_FragCoord.xy - inset) / scale;
  p.y = ${DESIGN_HEIGHT}.0 - p.y;

  vec3 color = uBase;

  vec2 offCentre = (p - vec2(${DESIGN_WIDTH}.0, ${DESIGN_HEIGHT}.0) * 0.5) / vec2(9.0, 6.0);
  color += uLine * 0.08 * (1.0 - clamp(length(offCentre), 0.0, 1.0));

  vec2 drift = vec2(p.x, p.y + uTime * 0.05);
  vec2 cell = abs(fract(drift) - 0.5);
  color += uLine * 0.03 * glow(min(cell.x, cell.y), 0.015);

  for (int i = 0; i < ${LINK_COUNT}; i++){
    vec2 a = uLink[i].xy;
    vec2 b = uLink[i].zw;
    float rail = segmentDistance(p, a, b);
    color += uLine * 0.07 * glow(rail, 0.020);

    float travel = fract(uTime * 0.2 + uLinkPhase[i]);
    float eased = travel * travel * (3.0 - 2.0 * travel);
    vec2 packet = a + (b - a) * eased;
    float alive = sin(travel * 3.1415926);
    float toPacket = length(p - packet);
    color += uLinkColor[i] * alive * (0.075 * glow(toPacket, 0.05) + 0.025 * glow(toPacket, 0.16));
    color += uLinkColor[i] * alive * 0.035 * glow(rail, 0.028) * smoothstep(0.7, 0.0, toPacket);
  }

  for (int i = 0; i < ${NODE_COUNT}; i++){
    float toNode = length(p - uNode[i]);
    float radius = uNodeRadius[i];
    float breathe = 0.86 + 0.14 * sin(uTime * 1.1 + float(i) * 1.7);
    color += uNodeColor[i] * 0.05 * glow(toNode, radius * 0.66) * breathe;
    color += uNodeColor[i] * 0.09 * glow(abs(toNode - radius), radius * 0.10);
    color = mix(color, uBase, 0.72 * smoothstep(radius * 0.95, radius * 0.78, toNode));
  }

  gl_FragColor = vec4(color, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function buildProgram(gl: WebGLRenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

// The palette lives once, in the daisyUI theme in style.css. Letting the
// browser resolve each custom property to an rgb() triple keeps the canvas
// and the fallback SVG reading the same source instead of duplicating hex
// values.
function readPalette(host: HTMLElement, variables: string[]) {
  const probe = document.createElement('span');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  host.appendChild(probe);
  const read = (variable: string): [number, number, number] => {
    probe.style.color = `var(${variable})`;
    const channels = getComputedStyle(probe)
      .color.match(/[\d.]+/g)
      ?.slice(0, 3)
      .map(Number);
    return channels && channels.length === 3
      ? [channels[0] / 255, channels[1] / 255, channels[2] / 255]
      : [0.5, 0.5, 0.5];
  };
  const palette: Record<string, [number, number, number]> = {};
  for (const variable of variables) palette[variable] = read(variable);
  probe.remove();
  return palette;
}

// A soft glow field looks the same upscaled, so the drawing buffer is capped.
// Fill cost then stays flat on integrated graphics at any window size or
// device pixel ratio.
const MAX_BUFFER_WIDTH = 1280;

export default function HeroCanvas() {
  let canvas!: HTMLCanvasElement;
  let fallback!: SVGGElement;

  onMount(() => {
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    const program = gl ? buildProgram(gl) : null;
    const buffer = gl && program ? gl.createBuffer() : null;

    let frame = 0;
    let onScreen = false;
    let contextLost = false;
    let origin = 0;
    let seconds = 0;

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      stop();
      fallback.classList.remove('opacity-0');
    };
    const onPreferenceChange = () => {
      origin = 0;
      sync();
    };
    const onVisibility = () => {
      origin = 0;
      sync();
    };

    const observer = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      origin = 0;
      sync();
    });
    const sizeObserver = new ResizeObserver(() => resize());

    canvas.addEventListener('webglcontextlost', onContextLost);
    onCleanup(() => {
      stop();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      reduceQuery.removeEventListener('change', onPreferenceChange);
      document.removeEventListener('visibilitychange', onVisibility);
      observer.disconnect();
      sizeObserver.disconnect();
      if (gl && program) gl.deleteProgram(program);
      if (gl && buffer) gl.deleteBuffer(buffer);
    });

    if (!gl || !program || !buffer) return;

    const palette = readPalette(canvas.parentElement ?? document.body, SCENE_VARIABLES);
    const nodePositions = new Float32Array(NODE_COUNT * 2);
    const nodeRadii = new Float32Array(NODE_COUNT);
    const nodeColors = new Float32Array(NODE_COUNT * 3);
    const linkEnds = new Float32Array(LINK_COUNT * 4);
    const linkColors = new Float32Array(LINK_COUNT * 3);
    const linkPhases = new Float32Array(LINK_COUNT);

    NODES.forEach((node, i) => {
      nodePositions[i * 2] = node.x;
      nodePositions[i * 2 + 1] = node.y;
      nodeRadii[i] = node.r;
      nodeColors.set(palette[nodeHue(node)], i * 3);
    });
    LINKS.forEach((link, i) => {
      linkEnds[i * 4] = NODES[link.from].x;
      linkEnds[i * 4 + 1] = NODES[link.from].y;
      linkEnds[i * 4 + 2] = NODES[link.to].x;
      linkEnds[i * 4 + 3] = NODES[link.to].y;
      linkColors.set(palette[ROLE_VARIABLE[link.role]], i * 3);
      linkPhases[i] = link.phase;
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const resolution = uniform('uRes');
    const elapsed = uniform('uTime');
    gl.uniform3fv(uniform('uBase'), palette['--color-base-100']);
    gl.uniform3fv(uniform('uLine'), palette['--color-line']);
    gl.uniform2fv(uniform('uNode'), nodePositions);
    gl.uniform1fv(uniform('uNodeRadius'), nodeRadii);
    gl.uniform3fv(uniform('uNodeColor'), nodeColors);
    gl.uniform4fv(uniform('uLink'), linkEnds);
    gl.uniform3fv(uniform('uLinkColor'), linkColors);
    gl.uniform1fv(uniform('uLinkPhase'), linkPhases);

    const draw = () => {
      if (contextLost || canvas.width < 1 || canvas.height < 1) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(elapsed, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) return;
      const density = Math.min(window.devicePixelRatio || 1, 2, MAX_BUFFER_WIDTH / box.width);
      const width = Math.max(1, Math.round(box.width * density));
      const height = Math.max(1, Math.round(box.height * density));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      draw();
    };

    const shouldAnimate = () =>
      onScreen && !document.hidden && !reduceQuery.matches && !contextLost;

    const tick = (now: number) => {
      if (!shouldAnimate()) {
        frame = 0;
        return;
      }
      if (!origin) origin = now;
      seconds = (now - origin) / 1000;
      draw();
      frame = requestAnimationFrame(tick);
    };

    function sync() {
      if (shouldAnimate()) {
        fallback.classList.add('opacity-0');
        if (!frame) frame = requestAnimationFrame(tick);
        return;
      }
      stop();
      if (reduceQuery.matches || contextLost) fallback.classList.remove('opacity-0');
      draw();
    }

    reduceQuery.addEventListener('change', onPreferenceChange);
    document.addEventListener('visibilitychange', onVisibility);
    observer.observe(canvas);
    sizeObserver.observe(canvas);
    resize();
    sync();
  });

  return (
    <div class="relative size-full">
      <canvas ref={canvas} class="absolute inset-0 size-full" aria-hidden="true" />
      <svg
        viewBox={`0 0 ${DESIGN_WIDTH} ${DESIGN_HEIGHT}`}
        class="absolute inset-0 size-full"
        role="img"
        aria-label={ARIA_LABEL}
      >
        <defs>
          <clipPath id="hero-tile-clip">
            <rect
              x={-TILE.half}
              y={-TILE.half}
              width={TILE.side}
              height={TILE.side}
              rx={TILE.radius}
            />
          </clipPath>
        </defs>
        {/* The fallback is the scene for no-JS, no-WebGL and reduced-motion
            visitors: same quiet background weight as the live frame, with the
            identity tiles above it. The presentation attribute keeps the
            mounted opacity-0 toggle in charge of the fade. */}
        <g
          ref={fallback}
          class="transition-opacity duration-500 ease-out-soft"
          opacity="0.25"
        >
          {LINKS.map((link) => (
            <line
              x1={NODES[link.from].x}
              y1={NODES[link.from].y}
              x2={NODES[link.to].x}
              y2={NODES[link.to].y}
              stroke={`var(${ROLE_VARIABLE[link.role]})`}
              stroke-width="0.022"
              opacity="0.5"
            />
          ))}
          {NODES.map((node) => (
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill="var(--color-base-100)"
              stroke={`var(${nodeHue(node)})`}
              stroke-width="0.04"
            />
          ))}
        </g>
        {/* Model tiles sit outside the fading fallback group: they are the
            identity layer, visible with no JavaScript, no WebGL, and over the
            live scene alike. The tile is the same rounded square either way,
            so a model without a published mark reads as a monogram tile, not
            as a hole. Below lg the copy spans the full band and no tile
            position can clear it, so the layer recedes to a level whose
            worst-case light tile blend (Anthropic's tan, OpenAI's light
            surface) still keeps dim body copy above the 4.5:1 floor. */}
        <g class="opacity-20 lg:opacity-100">
        {NODES.map((node) => {
          if (!node.model) return null;
          const identity = MODELS[node.model];
          return (
            <g transform={`translate(${node.x} ${node.y})`}>
              <rect
                x={-TILE.half}
                y={-TILE.half}
                width={TILE.side}
                height={TILE.side}
                rx={TILE.radius}
                fill={identity.tileFill ?? 'var(--color-base-200)'}
              />
              <g clip-path="url(#hero-tile-clip)">
                {identity.logo ? (
                  <image
                    href={asset(identity.logo)}
                    x={-TILE.half}
                    y={-TILE.half}
                    width={TILE.side}
                    height={TILE.side}
                    preserveAspectRatio="xMidYMid meet"
                  />
                ) : (
                  <text
                    class="font-mono"
                    x="0"
                    y="0"
                    font-size="0.26"
                    font-weight="600"
                    text-anchor="middle"
                    dominant-baseline="central"
                    fill={identity.hue}
                  >
                    {identity.monogram}
                  </text>
                )}
              </g>
              <rect
                x={-TILE.half}
                y={-TILE.half}
                width={TILE.side}
                height={TILE.side}
                rx={TILE.radius}
                fill="none"
                stroke={identity.hue}
                stroke-width="0.035"
              />
            </g>
          );
        })}
        {NODES.map((node) =>
          node.label ? (
            <text
              x={node.x}
              y={node.y + TILE.half + 0.52}
              fill="var(--color-dim)"
              font-size="0.18"
              text-anchor="middle"
            >
              {node.label}
            </text>
          ) : null,
        )}
        </g>
      </svg>
    </div>
  );
}