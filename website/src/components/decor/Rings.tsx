import { DecorProps, fraction, hueVariable } from './decor';

export interface RingsProps extends DecorProps {
  /** Diameter of the ring, in pixels. */
  size?: number;
  /** Centre of the ring across its host box, 0–1. */
  cx?: number;
  /** Centre of the ring down its host box, 0–1. */
  cy?: number;
}

/**
 * Geometric ring — one thin circle, the bezel of a gauge. Never filled, so it
 * frames a region without masking anything behind it.
 */
export default function Rings(props: RingsProps) {
  return (
    <div
      data-decor="ring"
      aria-hidden="true"
      class={props.class}
      style={{
        '--decor-hue': hueVariable(props.hue),
        '--decor-size': `${props.size ?? 420}px`,
        '--decor-x': fraction(props.cx, 0.5),
        '--decor-y': fraction(props.cy, 0.5),
        ...(props.opacity === undefined ? {} : { '--decor-opacity': String(props.opacity) }),
        ...props.style,
      }}
    />
  );
}