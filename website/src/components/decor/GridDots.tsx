import { DecorProps, fraction, hueVariable } from './decor';

export interface GridDotsProps extends DecorProps {
  /** Distance between dots, in pixels. */
  spacing?: number;
  /** Where the dot field is densest across its host box, 0–1. */
  cx?: number;
  /** Where the dot field is densest down its host box, 0–1. */
  cy?: number;
}

/**
 * Grid dots — the ledger's ruled field: a regular dot grid, strongest where it
 * is anchored and fading out with distance. Fills its host box.
 */
export default function GridDots(props: GridDotsProps) {
  return (
    <div
      data-decor="grid-dots"
      aria-hidden="true"
      class={props.class}
      style={{
        '--decor-hue': hueVariable(props.hue),
        '--dots-spacing': `${props.spacing ?? 28}px`,
        '--dots-x': fraction(props.cx, 0.5),
        '--dots-y': fraction(props.cy, 0),
        ...(props.opacity === undefined ? {} : { '--decor-opacity': String(props.opacity) }),
        ...props.style,
      }}
    />
  );
}