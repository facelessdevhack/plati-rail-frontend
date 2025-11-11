/**
 * PlatiSystem Design System - Input Component Classes
 *
 * Reusable input field styles for consistent design
 */

export const inputBase = 'w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-100';

export const inputVariants = {
  // Default Input
  default: `${inputBase} border-border-default bg-white text-text-primary placeholder-text-tertiary focus:border-brand-primary-500 focus:ring-brand-primary-500`,

  // Error State
  error: `${inputBase} border-semantic-error-500 bg-semantic-error-50 text-text-primary placeholder-text-tertiary focus:border-semantic-error-600 focus:ring-semantic-error-500`,

  // Success State
  success: `${inputBase} border-semantic-success-500 bg-semantic-success-50 text-text-primary placeholder-text-tertiary focus:border-semantic-success-600 focus:ring-semantic-success-500`,

  // Warning State
  warning: `${inputBase} border-semantic-warning-500 bg-semantic-warning-50 text-text-primary placeholder-text-tertiary focus:border-semantic-warning-600 focus:ring-semantic-warning-500`,

  // Filled variant
  filled: `${inputBase} border-transparent bg-background-tertiary text-text-primary placeholder-text-tertiary focus:border-brand-primary-500 focus:ring-brand-primary-500 focus:bg-white`,
};

export const inputSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
};

export const inputGroup = {
  wrapper: 'relative flex items-center',
  addonLeft: 'absolute left-3 flex items-center pointer-events-none text-text-tertiary',
  addonRight: 'absolute right-3 flex items-center pointer-events-none text-text-tertiary',
  withLeftAddon: 'pl-10',
  withRightAddon: 'pr-10',
};

export const inputLabel = {
  default: 'block text-sm font-medium text-text-primary mb-1.5',
  required: 'after:content-["*"] after:ml-0.5 after:text-semantic-error-500',
  optional: 'after:content-["(optional)"] after:ml-1 after:text-text-tertiary after:font-normal after:text-xs',
};

export const inputHelperText = {
  default: 'mt-1.5 text-xs text-text-secondary',
  error: 'mt-1.5 text-xs text-semantic-error-600',
  success: 'mt-1.5 text-xs text-semantic-success-600',
  warning: 'mt-1.5 text-xs text-semantic-warning-600',
};

// Utility function to combine input classes
export const getInputClasses = (variant = 'default', size = 'md', hasLeftAddon = false, hasRightAddon = false) => {
  const variantClass = inputVariants[variant] || inputVariants.default;
  const sizeClass = inputSizes[size] || inputSizes.md;
  const leftAddon = hasLeftAddon ? inputGroup.withLeftAddon : '';
  const rightAddon = hasRightAddon ? inputGroup.withRightAddon : '';
  return `${variantClass} ${sizeClass} ${leftAddon} ${rightAddon}`.trim();
};

export default {
  inputBase,
  inputVariants,
  inputSizes,
  inputGroup,
  inputLabel,
  inputHelperText,
  getInputClasses,
};
