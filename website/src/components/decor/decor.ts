import { JSX } from 'solid-js';

export const BRAND_HUES = ['primary', 'secondary', 'accent'] as const;

export type BrandHue = (typeof BRAND_HUES)[number];

export interface DecorProps {
  hue?: BrandHue;
  opacity?: number;
  class?: string;
  style?: JSX.CSSProperties;
}

export function hueVariable(hue: BrandHue | undefined): string {
  return `var(--color-${hue ?? 'secondary'})`;
}

export function fractionToPercent(value: number | undefined, fallback: number): string {
  return `${(value ?? fallback) * 100}%`;
}
