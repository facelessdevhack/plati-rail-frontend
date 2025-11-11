/**
 * PlatiSystem Design System - Spacing Tokens
 *
 * Consistent spacing scale for margins, padding, and gaps
 */

export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
};

// Common spacing patterns
export const spacingPatterns = {
  // Component Internal Spacing
  componentPaddingXs: 'px-2 py-1',      // Small buttons, tags
  componentPaddingSm: 'px-3 py-2',      // Normal buttons, inputs
  componentPaddingMd: 'px-4 py-3',      // Cards, modals
  componentPaddingLg: 'px-6 py-4',      // Large cards, sections
  componentPaddingXl: 'px-8 py-6',      // Page sections

  // Stack (Vertical) Spacing
  stackXs: 'space-y-1',   // 4px
  stackSm: 'space-y-2',   // 8px
  stackMd: 'space-y-4',   // 16px
  stackLg: 'space-y-6',   // 24px
  stackXl: 'space-y-8',   // 32px
  stack2xl: 'space-y-12', // 48px

  // Inline (Horizontal) Spacing
  inlineXs: 'space-x-1',  // 4px
  inlineSm: 'space-x-2',  // 8px
  inlineMd: 'space-x-4',  // 16px
  inlineLg: 'space-x-6',  // 24px
  inlineXl: 'space-x-8',  // 32px

  // Gap (Flex/Grid)
  gapXs: 'gap-1',   // 4px
  gapSm: 'gap-2',   // 8px
  gapMd: 'gap-4',   // 16px
  gapLg: 'gap-6',   // 24px
  gapXl: 'gap-8',   // 32px
  gap2xl: 'gap-12', // 48px

  // Section Spacing
  sectionSm: 'py-8',   // 32px
  sectionMd: 'py-12',  // 48px
  sectionLg: 'py-16',  // 64px
  sectionXl: 'py-24',  // 96px
};

export default spacing;
