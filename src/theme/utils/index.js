/**
 * PlatiSystem Design System - Utilities Index
 *
 * Central export for all utility functions and classes
 */

export {
  layoutPatterns,
  responsivePatterns,
  scrollPatterns,
  positionPatterns,
  default as layoutUtils
} from './layout';

export {
  utilityClasses,
  interactionStates,
  loadingStates,
  print,
  cn,
  mergeClasses,
  getStatusColor,
  getDomainColor,
  default as helpers
} from './helpers';

// Complete utilities export
export const utils = {
  layout: require('./layout').default,
  helpers: require('./helpers').default,
};

export default utils;
