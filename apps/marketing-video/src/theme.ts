/**
 * Brand theme for the Vestara marketing video.
 *
 * Reflects the product's "dark luxury + metallic gold" design language described
 * in the project README: deep navy/black backgrounds, glassmorphism panels, and
 * metallic gold accents.
 */

export const BRAND = {
  // Core palette
  bgDeep: '#0B0B12', // near-black navy base
  bgPanel: '#14141F', // raised panel
  gold: '#D4AF37', // primary metallic gold
  goldSoft: '#C9A24B', // softer gold for gradients
  goldBright: '#F4D77E', // highlight gold
  goldDeep: '#9A7B2E', // shadow gold
  platinum: '#E8E6E1', // off-white text
  ivory: '#F5F3EE',
  muted: '#8A8A9A', // muted gray-violet text
  white: '#FFFFFF',

  // Semantic accents (used sparingly for module icons)
  wallet: '#4FD1C5', // teal
  marketplace: '#F6AD55', // amber
  rewards: '#B794F4', // violet
  bookings: '#63B3ED', // sky
  ai: '#F687B3', // pink
  analytics: '#68D391', // green
} as const;

export const FONT_FAMILY =
  '"Jakarta Sans", "Inter", "Segoe UI", system-ui, -apple-system, sans-serif';

export const GOLD_GRADIENT = `linear-gradient(135deg, ${BRAND.goldBright} 0%, ${BRAND.gold} 45%, ${BRAND.goldDeep} 100%)`;

export type BrandColor = (typeof BRAND)[keyof typeof BRAND];
