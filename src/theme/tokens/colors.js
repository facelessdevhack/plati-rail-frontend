/**
 * PlatiSystem Design System - Color Tokens
 *
 * Comprehensive color palette for the ERP system
 * Based on manufacturing, inventory, and business workflows
 */

export const colors = {
  // Brand Colors
  brand: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',  // Primary brand color
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',  // Secondary brand color
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764',
    },
  },

  // Semantic Colors
  semantic: {
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',  // Success green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',  // Warning amber
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',  // Error red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    info: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',  // Info cyan
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
  },

  // Business Domain Colors
  domain: {
    // Production & Manufacturing
    production: {
      50: '#fef3c7',
      100: '#fde68a',
      500: '#f59e0b',  // Amber for production
      600: '#d97706',
      700: '#b45309',
    },
    // Inventory & Stock
    inventory: {
      50: '#dbeafe',
      100: '#bfdbfe',
      500: '#3b82f6',  // Blue for inventory
      600: '#2563eb',
      700: '#1d4ed8',
    },
    // Sales & Orders
    sales: {
      50: '#dcfce7',
      100: '#bbf7d0',
      500: '#22c55e',  // Green for sales
      600: '#16a34a',
      700: '#15803d',
    },
    // Finance & Payments
    finance: {
      50: '#e0f2fe',
      100: '#bae6fd',
      500: '#0ea5e9',  // Cyan for finance
      600: '#0284c7',
      700: '#0369a1',
    },
    // Quality & Warranty
    quality: {
      50: '#f3e8ff',
      100: '#e9d5ff',
      500: '#a855f7',  // Purple for quality
      600: '#9333ea',
      700: '#7e22ce',
    },
    // Dealers & Customers
    dealers: {
      50: '#fce7f3',
      100: '#fbcfe8',
      500: '#ec4899',  // Pink for dealers
      600: '#db2777',
      700: '#be185d',
    },
  },

  // Status Colors
  status: {
    pending: {
      bg: '#fef3c7',
      text: '#92400e',
      border: '#fbbf24',
    },
    inProgress: {
      bg: '#dbeafe',
      text: '#1e40af',
      border: '#3b82f6',
    },
    completed: {
      bg: '#dcfce7',
      text: '#14532d',
      border: '#22c55e',
    },
    cancelled: {
      bg: '#fee2e2',
      text: '#991b1b',
      border: '#ef4444',
    },
    paused: {
      bg: '#fef3c7',
      text: '#92400e',
      border: '#f59e0b',
    },
    urgent: {
      bg: '#fee2e2',
      text: '#7f1d1d',
      border: '#dc2626',
    },
  },

  // Neutral/Gray Scale
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    dark: '#111827',
    sidebar: '#1f2937',
    card: '#ffffff',
    hover: '#f3f4f6',
    selected: '#eff6ff',
  },

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
    link: '#2563eb',
    linkHover: '#1d4ed8',
    disabled: '#d1d5db',
  },

  // Border Colors
  border: {
    light: '#e5e7eb',
    default: '#d1d5db',
    dark: '#9ca3af',
    focus: '#3b82f6',
    error: '#ef4444',
    success: '#22c55e',
  },
};

export default colors;
