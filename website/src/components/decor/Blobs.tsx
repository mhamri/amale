import { DecorProps, fractionToPercent, hueVariable } from './decor';

export interface BlobsProps extends DecorProps {
  diameterPx?: number;
  centreXFraction?: number;
  centreYFraction?: number;
  blurPx?: number;
}

export default function Blobs(props: BlobsProps) {
  return (
    <div
      data-decor="blob"
      aria-hidden="true"
      class={props.class}
      style={{
        '--decor-hue': hueVariable(props.hue),
        '--decor-size': `${props.diameterPx ?? 360}px`,
        '--decor-x': fractionToPercent(props.centreXFraction, 0.5),
        '--decor-y': fractionToPercent(props.centreYFraction, 0.5),
        '--blob-blur': `${props.blurPx ?? 40}px`,
        ...(props.opacity === undefined ? {} : { '--decor-opacity': String(props.opacity) }),
        ...props.style,
      }}
    />
  );
}
