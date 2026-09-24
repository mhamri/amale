import { DecorProps, fractionToPercent, hueVariable } from './decor';

export interface GridDotsProps extends DecorProps {
  spacingPx?: number;
  centreXFraction?: number;
  centreYFraction?: number;
}

export default function GridDots(props: GridDotsProps) {
  return (
    <div
      data-decor="grid-dots"
      aria-hidden="true"
      class={props.class}
      style={{
        '--decor-hue': hueVariable(props.hue),
        '--dots-spacing': `${props.spacingPx ?? 28}px`,
        '--dots-x': fractionToPercent(props.centreXFraction, 0.5),
        '--dots-y': fractionToPercent(props.centreYFraction, 0),
        ...(props.opacity === undefined ? {} : { '--decor-opacity': String(props.opacity) }),
        ...props.style,
      }}
    />
  );
}
