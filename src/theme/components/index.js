/**
 * PlatiSystem Design System - Component Classes Index
 *
 * Central export for all component class utilities
 */

export { default as Button, buttonBase, buttonVariants, buttonSizes, buttonIconSizes, getButtonClasses } from './Button';
export { default as Card, cardBase, cardVariants, cardPadding, cardSections, getCardClasses } from './Card';
export { default as Input, inputBase, inputVariants, inputSizes, inputGroup, inputLabel, inputHelperText, getInputClasses } from './Input';
export { default as Badge, badgeBase, badgeVariants, badgeSizes, badgeDot, getBadgeClasses } from './Badge';

// Component utilities object
export const components = {
  Button: require('./Button').default,
  Card: require('./Card').default,
  Input: require('./Input').default,
  Badge: require('./Badge').default,
};

export default components;
