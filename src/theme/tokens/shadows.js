/**
 * PlatiSystem Design System - Shadow Tokens
 *
 * Box shadows for depth and elevation
 */

export const shadows = {
  // Standard Shadows
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',

  // Colored Shadows for emphasis
  primarySm: '0 1px 2px 0 rgb(59 130 246 / 0.1)',
  primary: '0 4px 12px 0 rgb(59 130 246 / 0.15)',
  primaryLg: '0 8px 20px 0 rgb(59 130 246 / 0.2)',

  successSm: '0 1px 2px 0 rgb(34 197 94 / 0.1)',
  success: '0 4px 12px 0 rgb(34 197 94 / 0.15)',
  successLg: '0 8px 20px 0 rgb(34 197 94 / 0.2)',

  warningSm: '0 1px 2px 0 rgb(245 158 11 / 0.1)',
  warning: '0 4px 12px 0 rgb(245 158 11 / 0.15)',
  warningLg: '0 8px 20px 0 rgb(245 158 11 / 0.2)',

  errorSm: '0 1px 2px 0 rgb(239 68 68 / 0.1)',
  error: '0 4px 12px 0 rgb(239 68 68 / 0.15)',
  errorLg: '0 8px 20px 0 rgb(239 68 68 / 0.2)',

  // Elevation shadows (for layering)
  elevation1: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  elevation2: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  elevation3: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  elevation4: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  elevation5: '0 25px 50px -12px rgb(0 0 0 / 0.25)',

  // Glow effects
  glow: '0 0 20px rgb(59 130 246 / 0.3)',
  glowStrong: '0 0 30px rgb(59 130 246 / 0.5)',
};

// Predefined shadow patterns
export const shadowPatterns = {
  card: 'shadow-md hover:shadow-lg transition-shadow duration-200',
  cardInteractive: 'shadow-sm hover:shadow-xl transition-shadow duration-300',
  button: 'shadow-sm hover:shadow-md active:shadow-sm transition-shadow duration-150',
  dropdown: 'shadow-lg',
  modal: 'shadow-2xl',
  tooltip: 'shadow-md',
  floating: 'shadow-xl',
};

export default shadows;
