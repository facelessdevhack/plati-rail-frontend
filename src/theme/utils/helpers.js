/**
 * PlatiSystem Design System - Helper Utilities
 *
 * Utility classes and helper functions
 */

export const utilityClasses = {
  // Truncate text
  truncate: 'truncate',
  truncate2: 'line-clamp-2',
  truncate3: 'line-clamp-3',
  truncate4: 'line-clamp-4',

  // Aspect ratios
  aspectSquare: 'aspect-square',
  aspectVideo: 'aspect-video',
  aspect4x3: 'aspect-[4/3]',
  aspect16x9: 'aspect-[16/9]',

  // Screen reader only
  srOnly: 'sr-only',
  notSrOnly: 'not-sr-only',

  // Pointer events
  pointerNone: 'pointer-events-none',
  pointerAuto: 'pointer-events-auto',

  // User select
  selectNone: 'select-none',
  selectText: 'select-text',
  selectAll: 'select-all',

  // Cursor
  cursorPointer: 'cursor-pointer',
  cursorNotAllowed: 'cursor-not-allowed',
  cursorWait: 'cursor-wait',
  cursorHelp: 'cursor-help',

  // Visibility
  visible: 'visible',
  invisible: 'invisible',
  hidden: 'hidden',

  // Backdrop
  backdropBlur: 'backdrop-blur-sm',
  backdropBlurMd: 'backdrop-blur-md',
  backdropBlurLg: 'backdrop-blur-lg',

  // Ring
  ringFocus: 'focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-2',
  ringError: 'focus:ring-2 focus:ring-semantic-error-500 focus:ring-offset-2',
  ringSuccess: 'focus:ring-2 focus:ring-semantic-success-500 focus:ring-offset-2',
};

export const interactionStates = {
  // Hover states
  hoverBrightness: 'hover:brightness-110',
  hoverOpacity: 'hover:opacity-80',
  hoverScale: 'hover:scale-105',
  hoverShadow: 'hover:shadow-lg',

  // Active states
  activeBrightness: 'active:brightness-90',
  activeOpacity: 'active:opacity-70',
  activeScale: 'active:scale-95',

  // Focus states
  focusRing: 'focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-2',
  focusVisible: 'focus-visible:ring-2 focus-visible:ring-brand-primary-500',

  // Disabled states
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  disabledGray: 'disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed',

  // Group hover
  groupHover: 'group-hover:opacity-100',
  groupHoverTranslate: 'group-hover:translate-x-1',
};

export const loadingStates = {
  skeleton: 'animate-pulse bg-neutral-200 rounded',
  spinner: 'animate-spin rounded-full border-2 border-neutral-200 border-t-brand-primary-500',
  shimmer: 'animate-shimmer bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-100 bg-[length:200%_100%]',
};

export const print = {
  hiddenPrint: 'print:hidden',
  visiblePrint: 'print:block',
  pageBreak: 'print:break-after-page',
  avoidBreak: 'print:break-inside-avoid',
};

// Helper function to conditionally join classes
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Helper function to merge tailwind classes (handles conflicts)
export const mergeClasses = (baseClasses, overrideClasses) => {
  if (!overrideClasses) return baseClasses;

  const base = baseClasses.split(' ');
  const override = overrideClasses.split(' ');

  // Simple merge - in production you might want to use clsx/tailwind-merge
  return [...new Set([...base, ...override])].join(' ');
};

// Helper to get status color classes
export const getStatusColor = (status) => {
  const statusMap = {
    pending: 'bg-status-pending-bg text-status-pending-text border-status-pending-border',
    inProgress: 'bg-status-inProgress-bg text-status-inProgress-text border-status-inProgress-border',
    completed: 'bg-status-completed-bg text-status-completed-text border-status-completed-border',
    cancelled: 'bg-status-cancelled-bg text-status-cancelled-text border-status-cancelled-border',
    paused: 'bg-status-paused-bg text-status-paused-text border-status-paused-border',
    urgent: 'bg-status-urgent-bg text-status-urgent-text border-status-urgent-border',
  };

  return statusMap[status] || statusMap.pending;
};

// Helper to get domain color classes
export const getDomainColor = (domain) => {
  const domainMap = {
    production: 'bg-domain-production-50 text-domain-production-700 border-domain-production-500',
    inventory: 'bg-domain-inventory-50 text-domain-inventory-700 border-domain-inventory-500',
    sales: 'bg-domain-sales-50 text-domain-sales-700 border-domain-sales-500',
    finance: 'bg-domain-finance-50 text-domain-finance-700 border-domain-finance-500',
    quality: 'bg-domain-quality-50 text-domain-quality-700 border-domain-quality-500',
    dealers: 'bg-domain-dealers-50 text-domain-dealers-700 border-domain-dealers-500',
  };

  return domainMap[domain] || '';
};

export default {
  utilityClasses,
  interactionStates,
  loadingStates,
  print,
  cn,
  mergeClasses,
  getStatusColor,
  getDomainColor,
};
