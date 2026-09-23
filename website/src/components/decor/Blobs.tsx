import { DecorProps, fraction, hueVariable } from './decor';

export interface BlobsProps extends DecorProps {
  /** Diameter of the blob before its blur, in pixels. */
  size?: number;
  /** Centre of the blob across its host box, 0–1. */
  cx?: number;
  /** Centre of the blob down its host box, 0–1. */
  cy?: number;
  /** Blur radius in pixels. */
  blur?: number;
}

/**
 * Blurred blob — a soft coloured mass with no edge at all, for a section that
 * wants a coloured corner rather than a shape a reader can trace.
 */
export default function Blobs(props: BlobsProps) {
  return (
    <div
      data-decor="blob"
      aria-hidden="true"
      class={props.class}
      style={{
        '--decor-hue': hueVariable(props.hue),
        '--decor-size': `${props.size ?? 360}px`,
        '--decor-x': fraction(props.cx, 0.5),
        '--decor-y': fraction(props.cy, 0.5),
        '--blob-blur': `${props.blur ?? 40}px`,
        ...(props.opacity === undefined ? {} : { '--decor-opacity': String(props.opacity) }),
        ...props.style,
      }}
    />
  );
}