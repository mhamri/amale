import { JSX } from 'solid-js';

export interface DrifterProps {
  direction?: 'vertical' | 'horizontal';
  distancePx?: number;
  class?: string;
  style?: JSX.CSSProperties;
  children?: JSX.Element;
}

export default function Drifter(props: DrifterProps) {
  return (
    <div
      data-decor="drift"
      data-drift={props.direction ?? 'vertical'}
      aria-hidden="true"
      class={props.class}
      style={{
        ...(props.distancePx === undefined ? {} : { '--drift-distance': `${props.distancePx}px` }),
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}
