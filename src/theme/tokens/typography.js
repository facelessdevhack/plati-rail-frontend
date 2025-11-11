/**
 * PlatiSystem Design System - Typography Tokens
 *
 * Font families, sizes, weights, and line heights
 */

export const typography = {
  // Font Families
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ],
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'Consolas',
      'Monaco',
      'Courier New',
      'monospace',
    ],
  },

  // Font Sizes with line heights
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
    '5xl': ['3rem', { lineHeight: '1' }],           // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],         // 72px
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
};

// Predefined text styles for common use cases
export const textStyles = {
  // Headings
  h1: 'text-4xl font-bold text-text-primary leading-tight',
  h2: 'text-3xl font-bold text-text-primary leading-tight',
  h3: 'text-2xl font-semibold text-text-primary leading-snug',
  h4: 'text-xl font-semibold text-text-primary leading-snug',
  h5: 'text-lg font-semibold text-text-primary leading-normal',
  h6: 'text-base font-semibold text-text-primary leading-normal',

  // Body Text
  bodyLarge: 'text-lg font-normal text-text-primary leading-relaxed',
  body: 'text-base font-normal text-text-primary leading-normal',
  bodySmall: 'text-sm font-normal text-text-secondary leading-normal',

  // Labels
  label: 'text-sm font-medium text-text-primary',
  labelSmall: 'text-xs font-medium text-text-secondary',
  labelLarge: 'text-base font-medium text-text-primary',

  // Captions
  caption: 'text-xs font-normal text-text-secondary',
  captionBold: 'text-xs font-semibold text-text-secondary',

  // Links
  link: 'text-base font-medium text-text-link hover:text-text-linkHover underline cursor-pointer',
  linkSubtle: 'text-sm font-normal text-text-link hover:text-text-linkHover cursor-pointer',

  // Code
  code: 'font-mono text-sm bg-neutral-100 px-1.5 py-0.5 rounded',
  codeBlock: 'font-mono text-sm bg-neutral-900 text-neutral-50 p-4 rounded-lg',

  // Utility
  overline: 'text-xs font-semibold uppercase tracking-wider text-text-secondary',
  display: 'text-5xl font-bold text-text-primary leading-none',
};

export default typography;
