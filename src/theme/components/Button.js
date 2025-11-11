/**
 * PlatiSystem Design System - Button Component Classes
 *
 * Reusable button styles for consistent design
 */

export const buttonBase = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

export const buttonVariants = {
  // Primary Button
  primary: `${buttonBase} bg-brand-primary-500 text-white hover:bg-brand-primary-600 active:bg-brand-primary-700 focus:ring-brand-primary-500 shadow-sm hover:shadow-md`,

  // Secondary Button
  secondary: `${buttonBase} bg-brand-secondary-500 text-white hover:bg-brand-secondary-600 active:bg-brand-secondary-700 focus:ring-brand-secondary-500 shadow-sm hover:shadow-md`,

  // Outline Button
  outline: `${buttonBase} bg-transparent border-2 border-brand-primary-500 text-brand-primary-600 hover:bg-brand-primary-50 active:bg-brand-primary-100 focus:ring-brand-primary-500`,

  // Ghost Button
  ghost: `${buttonBase} bg-transparent text-brand-primary-600 hover:bg-brand-primary-50 active:bg-brand-primary-100 focus:ring-brand-primary-500`,

  // Danger Button
  danger: `${buttonBase} bg-semantic-error-500 text-white hover:bg-semantic-error-600 active:bg-semantic-error-700 focus:ring-semantic-error-500 shadow-sm hover:shadow-md`,

  // Success Button
  success: `${buttonBase} bg-semantic-success-500 text-white hover:bg-semantic-success-600 active:bg-semantic-success-700 focus:ring-semantic-success-500 shadow-sm hover:shadow-md`,

  // Warning Button
  warning: `${buttonBase} bg-semantic-warning-500 text-white hover:bg-semantic-warning-600 active:bg-semantic-warning-700 focus:ring-semantic-warning-500 shadow-sm hover:shadow-md`,

  // Text Button
  text: `${buttonBase} bg-transparent text-brand-primary-600 hover:bg-brand-primary-50 focus:ring-brand-primary-500`,

  // Link Button
  link: `${buttonBase} bg-transparent text-text-link hover:text-text-linkHover underline focus:ring-brand-primary-500`,
};

export const buttonSizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

export const buttonIconSizes = {
  xs: 'p-1',
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
  xl: 'p-4',
};

// Utility function to combine button classes
export const getButtonClasses = (variant = 'primary', size = 'md', isIconOnly = false) => {
  const variantClass = buttonVariants[variant] || buttonVariants.primary;
  const sizeClass = isIconOnly ? buttonIconSizes[size] : buttonSizes[size];
  return `${variantClass} ${sizeClass}`;
};

export default {
  buttonBase,
  buttonVariants,
  buttonSizes,
  buttonIconSizes,
  getButtonClasses,
};
