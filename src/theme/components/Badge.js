/**
 * PlatiSystem Design System - Badge Component Classes
 *
 * Reusable badge/tag styles for status indicators
 */

export const badgeBase = 'inline-flex items-center font-medium rounded-full';

export const badgeVariants = {
  // Status Badges
  pending: 'bg-status-pending-bg text-status-pending-text border border-status-pending-border',
  inProgress: 'bg-status-inProgress-bg text-status-inProgress-text border border-status-inProgress-border',
  completed: 'bg-status-completed-bg text-status-completed-text border border-status-completed-border',
  cancelled: 'bg-status-cancelled-bg text-status-cancelled-text border border-status-cancelled-border',
  paused: 'bg-status-paused-bg text-status-paused-text border border-status-paused-border',
  urgent: 'bg-status-urgent-bg text-status-urgent-text border border-status-urgent-border',

  // Semantic Badges
  success: 'bg-semantic-success-100 text-semantic-success-700 border border-semantic-success-300',
  warning: 'bg-semantic-warning-100 text-semantic-warning-700 border border-semantic-warning-300',
  error: 'bg-semantic-error-100 text-semantic-error-700 border border-semantic-error-300',
  info: 'bg-semantic-info-100 text-semantic-info-700 border border-semantic-info-300',

  // Domain Badges
  production: 'bg-domain-production-50 text-domain-production-700 border border-domain-production-500',
  inventory: 'bg-domain-inventory-50 text-domain-inventory-700 border border-domain-inventory-500',
  sales: 'bg-domain-sales-50 text-domain-sales-700 border border-domain-sales-500',
  finance: 'bg-domain-finance-50 text-domain-finance-700 border border-domain-finance-500',
  quality: 'bg-domain-quality-50 text-domain-quality-700 border border-domain-quality-500',
  dealers: 'bg-domain-dealers-50 text-domain-dealers-700 border border-domain-dealers-500',

  // Neutral Badges
  default: 'bg-neutral-100 text-neutral-700 border border-neutral-300',
  dark: 'bg-neutral-800 text-white border border-neutral-700',
  light: 'bg-white text-neutral-700 border border-neutral-300',
};

export const badgeSizes = {
  xs: 'px-2 py-0.5 text-xs',
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const badgeDot = {
  wrapper: 'flex items-center gap-1.5',
  dot: 'w-2 h-2 rounded-full',
  dotColors: {
    pending: 'bg-status-pending-border',
    inProgress: 'bg-status-inProgress-border',
    completed: 'bg-status-completed-border',
    cancelled: 'bg-status-cancelled-border',
    urgent: 'bg-status-urgent-border',
    success: 'bg-semantic-success-500',
    warning: 'bg-semantic-warning-500',
    error: 'bg-semantic-error-500',
    info: 'bg-semantic-info-500',
  },
};

// Utility function to combine badge classes
export const getBadgeClasses = (variant = 'default', size = 'md') => {
  const variantClass = badgeVariants[variant] || badgeVariants.default;
  const sizeClass = badgeSizes[size] || badgeSizes.md;
  return `${badgeBase} ${variantClass} ${sizeClass}`;
};

export default {
  badgeBase,
  badgeVariants,
  badgeSizes,
  badgeDot,
  getBadgeClasses,
};
