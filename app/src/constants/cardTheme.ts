/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║        MOBILE DESIGN SYSTEM — CARD TOKENS (SINGLE SOURCE OF TRUTH) ║
 * ║                                                                    ║
 * ║  ⭐ ALL CARD BORDER-RADIUS VALUES ARE CONTROLLED HERE ⭐          ║
 * ║                                                                    ║
 * ║  To adjust the border radius of ALL cards across the mobile app:   ║
 * ║  Simply change `CARD_BORDER_RADIUS.default` in this one file.      ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */

export type MobileCardRadiusPreset =
  | 'default'
  | 'none'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | 'full';

export type MobileCardShadowPreset =
  | 'none'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl';

/**
 * Global Card Border Radius Configuration for React Native.
 * 
 * 👉 TO CHANGE THE BORDER RADIUS FOR ALL CARDS IN THE MOBILE APP:
 * Simply change `default` below (e.g. 16, 18, 20, 24).
 */
export const CARD_BORDER_RADIUS: Record<MobileCardRadiusPreset, number> = {
  default: 18, // ⭐ Master switch: default corner radius for mobile cards
  none: 0,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 28,
  full: 9999,
};

/**
 * Elevation presets for React Native getShadow() helper.
 */
export const CARD_SHADOW_ELEVATIONS: Record<MobileCardShadowPreset, number> = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
};
