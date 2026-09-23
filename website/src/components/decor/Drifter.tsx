import { JSX } from 'solid-js';

export interface DrifterProps {
  /** Axis the layer drifts along. */
  direction?: 'vertical' | 'horizontal';
  /** How far the layer drifts, in pixels. */
  distance?: number;
  class?: string;
  style?: JSX.CSSProperties;
  children?: JSX.Element;
}

/**
 * Drifter — an ambient layer that moves slowly, for ever, on its own. Wrap a
 * Glow, LightRays or Blobs in it to make the light breathe instead of sitting
 * still; the drift stops entirely under `prefers-reduced-motion: reduce`.
 */
export default function Drifter(props: DrifterProps) {
  return (
    <div
      data-decor="drift"
      data-drift={props.direction ?? 'vertical'}
      aria-hidden="true"
      class={props.class}
      style={{
        ...(props.distance === undefined ? {} : { '--drift-distance': `${props.distance}px` }),
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}