/**
 * PlatiSystem Design System - Card Component Classes
 *
 * Reusable card styles for consistent design
 */

export const cardBase = 'bg-background-card rounded-lg transition-shadow duration-200';

export const cardVariants = {
  // Default Card
  default: `${cardBase} border border-border-light shadow-sm hover:shadow-md`,

  // Elevated Card
  elevated: `${cardBase} shadow-md hover:shadow-lg`,

  // Outlined Card
  outlined: `${cardBase} border-2 border-border-default`,

  // Flat Card
  flat: `${cardBase} bg-background-secondary`,

  // Interactive Card
  interactive: `${cardBase} border border-border-light shadow-sm hover:shadow-xl hover:border-brand-primary-300 cursor-pointer transition-all duration-300`,

  // Status Cards
  success: `${cardBase} border-2 border-semantic-success-500 bg-semantic-success-50`,
  warning: `${cardBase} border-2 border-semantic-warning-500 bg-semantic-warning-50`,
  error: `${cardBase} border-2 border-semantic-error-500 bg-semantic-error-50`,
  info: `${cardBase} border-2 border-semantic-info-500 bg-semantic-info-50`,
};

export const cardPadding = {
  none: '',
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export const cardSections = {
  header: 'border-b border-border-light pb-4 mb-4',
  body: 'space-y-4',
  footer: 'border-t border-border-light pt-4 mt-4',
};

// Utility function to combine card classes
export const getCardClasses = (variant = 'default', padding = 'md') => {
  const variantClass = cardVariants[variant] || cardVariants.default;
  const paddingClass = cardPadding[padding] || cardPadding.md;
  return `${variantClass} ${paddingClass}`;
};

export default {
  cardBase,
  cardVariants,
  cardPadding,
  cardSections,
  getCardClasses,
};
