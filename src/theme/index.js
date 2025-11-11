/**
 * PlatiSystem Design System - Main Entry Point
 *
 * Complete design system export
 */

// Design Tokens
export * from './tokens';
export { default as tokens } from './tokens';

// Component Classes
export * from './components';
export { default as components } from './components';

// Utilities
export * from './utils';
export { default as utils } from './utils';

// Complete theme object
export const theme = {
  tokens: require('./tokens').default,
  components: require('./components').default,
  utils: require('./utils').default,
};

export default theme;
