/**
 * PlatiSystem Design System - Design Tokens Index
 *
 * Central export for all design tokens
 */

export { colors, default as colorsDefault } from './colors';
export { typography, textStyles, default as typographyDefault } from './typography';
export { spacing, spacingPatterns, default as spacingDefault } from './spacing';
export { shadows, shadowPatterns, default as shadowsDefault } from './shadows';
export { animations, transitionPatterns, default as animationsDefault } from './animations';

// Complete token export
export const tokens = {
  colors: require('./colors').colors,
  typography: require('./typography').typography,
  spacing: require('./spacing').spacing,
  shadows: require('./shadows').shadows,
  animations: require('./animations').animations,
};

export default tokens;
