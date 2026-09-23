import { DecorProps, fraction, hueVariable } from './decor';

export interface LightRaysProps extends DecorProps {
  /** Direction the beam travels, in degrees clockwise from straight down. */
  angle?: number;
  /** Where the beam's apex sits across its host box, 0–1. */
  cx?: number;
  /** Where the beam's apex sits down its host box, 0–1. */
  cy?: number;
  /** Width of the whole cone, in degrees. */
  spread?: number;
}

/**
 * Light rays — a soft conic beam falling across the page: the warm core of the
 * lamp plus a wider halo around it. Fills its host box and is drawn entirely
 * from the hue it is given.
 */
export default function LightRays(props: LightRaysProps) {
  return (
    <div
      data-decor="light-rays"
      aria-hidden="true"
      class={props.class}
      style={{
        '--decor-hue': hueVariable(props.hue),
        '--rays-angle': `${props.angle ?? 0}deg`,
        '--rays-x': fraction(props.cx, 0.5),
        '--rays-y': fraction(props.cy, 0),
        '--rays-spread': `${props.spread ?? 108}deg`,
        ...(props.opacity === undefined ? {} : { '--decor-opacity': String(props.opacity) }),
        ...props.style,
      }}
    />
  );
}