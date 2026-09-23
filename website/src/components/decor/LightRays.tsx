import { DecorProps, fractionToPercent, hueVariable } from './decor';

export interface LightRaysProps extends DecorProps {
  angleDegrees?: number;
  apexXFraction?: number;
  apexYFraction?: number;
  spreadDegrees?: number;
}

export default function LightRays(props: LightRaysProps) {
  return (
    <div
      data-decor="light-rays"
      aria-hidden="true"
      class={props.class}
      style={{
        '--decor-hue': hueVariable(props.hue),
        '--rays-angle': `${props.angleDegrees ?? 0}deg`,
        '--rays-x': fractionToPercent(props.apexXFraction, 0.5),
        '--rays-y': fractionToPercent(props.apexYFraction, 0),
        '--rays-spread': `${props.spreadDegrees ?? 108}deg`,
        ...(props.opacity === undefined ? {} : { '--decor-opacity': String(props.opacity) }),
        ...props.style,
      }}
    />
  );
}
