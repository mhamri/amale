import { DecorProps, fractionToPercent, hueVariable } from './decor';

export interface RingsProps extends DecorProps {
  diameterPx?: number;
  centreXFraction?: number;
  centreYFraction?: number;
}

export default function Rings(props: RingsProps) {
  return (
    <div
      data-decor="ring"
      aria-hidden="true"
      class={props.class}
      style={{
        '--decor-hue': hueVariable(props.hue),
        '--decor-size': `${props.diameterPx ?? 420}px`,
        '--decor-x': fractionToPercent(props.centreXFraction, 0.5),
        '--decor-y': fractionToPercent(props.centreYFraction, 0.5),
        ...(props.opacity === undefined ? {} : { '--decor-opacity': String(props.opacity) }),
        ...props.style,
      }}
    />
  );
}
