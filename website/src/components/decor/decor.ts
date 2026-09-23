import { JSX } from 'solid-js';

/**
 * Shared vocabulary for the decor layer documented in DESIGN-SYSTEM.md.
 *
 * Every decor component renders exactly one element carrying `data-decor`
 * (the layer kind) and `aria-hidden="true"`. Geometry, hue and opacity travel
 * as CSS custom properties, so every layer is positioned by the stylesheet in
 * `style.css` and never by inline layout rules.
 */

/** The three brand hues the depth system tints with. */
export const BRAND_HUES = ['primary', 'secondary', 'accent'] as const;

export type BrandHue = (typeof BRAND_HUES)[number];

export interface DecorProps {
  /** Brand hue the layer is tinted with. Defaults to `secondary`. */
  hue?: BrandHue;
  /** Peak opacity of the layer, 0–1. Defaults to the layer's own value. */
  opacity?: number;
  /** Extra classes for placement; the host box is the positioning context. */
  class?: string;
  /** Extra inline custom properties, merged last. */
  style?: JSX.CSSProperties;
}

/** The theme variable a brand hue resolves to. */
export function hueVariable(hue: BrandHue | undefined): string {
  return `var(--color-${hue ?? 'secondary'})`;
}

/** Fraction of a host box, as a CSS percentage. */
export function fraction(value: number | undefined, fallback: number): string {
  return `${(value ?? fallback) * 100}%`;
}