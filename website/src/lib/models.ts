/*
 * One identity list for every model Amale routes to: the Latin-script name,
 * the routed hue, the monogram and the vendor mark live in one place. The
 * hero's logo tiles read from here — a model whose vendor publishes a mark
 * renders that mark, and a model without one renders its monogram in the
 * model's routed hue, in the same tile size and shape either way. Dropping a
 * correctly named file into website/public/models upgrades a monogram to a
 * logo with no code change.
 *
 * Vendor marks are third-party marks used only to name the models Amale
 * routes to. They are served from this site, never hotlinked, and never
 * redrawn, recoloured or combined with the Amale mark.
 */

export type ModelId =
  | 'deepseek'
  | 'glm'
  | 'mimo'
  | 'solar'
  | 'kimi'
  | 'jev'
  | 'anthropic'
  | 'openai';

export type ModelIdentity = {
  /** Name as the site's copy uses it. */
  name: string;
  /** Single letter rendered when no vendor mark exists. */
  monogram: string;
  /** The model's routed hue: a colour custom property from the amale theme. */
  hue: string;
  /** Vendor mark under public/, or null when none is published. */
  logo: string | null;
  /** Vendor the mark belongs to, for attribution in code. */
  vendor: string | null;
  /**
   * Tile surface behind a mark that carries no background of its own.
   * Marks published as filled squares (Anthropic, DeepSeek, MoonshotAI)
   * cover the tile themselves; OpenAI's blossom is black on transparency,
   * so its tile carries a light surface from the theme to stay legible on
   * the night-ledger background.
   */
  tileFill?: string;
};

export const MODELS: Record<ModelId, ModelIdentity> = {
  deepseek: {
    name: 'DeepSeek',
    monogram: 'D',
    hue: 'var(--color-secondary)',
    logo: 'models/DeepSeek.png',
    vendor: 'DeepSeek',
  },
  glm: {
    name: 'GLM',
    monogram: 'G',
    hue: 'var(--color-info)',
    logo: null,
    vendor: null,
  },
  mimo: {
    name: 'MiMo',
    monogram: 'M',
    hue: 'var(--color-success)',
    logo: null,
    vendor: null,
  },
  solar: {
    name: 'Solar',
    monogram: 'S',
    hue: 'var(--color-primary)',
    logo: null,
    vendor: null,
  },
  kimi: {
    name: 'Kimi',
    monogram: 'K',
    hue: 'var(--color-warning)',
    logo: 'models/MoonshotAI.png',
    vendor: 'MoonshotAI',
  },
  jev: {
    name: 'Jev',
    monogram: 'J',
    hue: 'var(--color-accent)',
    logo: null,
    vendor: null,
  },
  anthropic: {
    name: 'Anthropic',
    monogram: 'A',
    hue: 'var(--color-error)',
    logo: 'models/Anthropic.svg',
    vendor: 'Anthropic',
  },
  openai: {
    name: 'OpenAI',
    monogram: 'O',
    hue: 'var(--color-neutral-content)',
    logo: 'models/OpenAI.svg',
    vendor: 'OpenAI',
    tileFill: 'var(--color-base-content)',
  },
};