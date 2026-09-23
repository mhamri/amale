import { DecorProps, fractionToPercent, hueVariable } from './decor';

export interface GlowProps extends DecorProps {
  diameterPx?: number;
  centreXFraction?: number;
  centreYFraction?: number;
}

export default function Glow(props: GlowProps) {
  return (
    <div
      data-decor="radial-glow"
      aria-hidden="true"
      class={props.class}
      style={{
        '--decor-hue': hueVariable(props.hue),
        '--decor-size': `${props.diameterPx ?? 640}px`,
        '--decor-x': fractionToPercent(props.centreXFraction, 0.5),
        '--decor-y': fractionToPercent(props.centreYFraction, 0.5),
        ...(props.opacity === undefined ? {} : { '--decor-opacity': String(props.opacity) }),
        ...props.style,
      }}
    />
  );
}
