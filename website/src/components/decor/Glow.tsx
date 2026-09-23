import { DecorProps, fraction, hueVariable } from './decor';

export interface GlowProps extends DecorProps {
  /** Diameter of the bloom, in pixels. */
  size?: number;
  /** Centre of the bloom across its host box, 0–1. */
  cx?: number;
  /** Centre of the bloom down its host box, 0–1. */
  cy?: number;
}

/**
 * Radial hue glow — a soft blooming disc, the light a screen throws on the
 * desk. Absolutely positioned and pointer-transparent, so it never takes a
 * click and never carries text.
 */
export default function Glow(props: GlowProps) {
  return (
    <div
      data-decor="radial-glow"
      aria-hidden="true"
      class={props.class}
      style={{
        '--decor-hue': hueVariable(props.hue),
        '--decor-size': `${props.size ?? 640}px`,
        '--decor-x': fraction(props.cx, 0.5),
        '--decor-y': fraction(props.cy, 0.5),
        ...(props.opacity === undefined ? {} : { '--decor-opacity': String(props.opacity) }),
        ...props.style,
      }}
    />
  );
}