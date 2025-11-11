/**
 * PlatiSystem Design System - Animation Tokens
 *
 * Transitions, animations, and timing functions
 */

export const animations = {
  // Transition Durations
  duration: {
    instant: '75ms',
    fast: '150ms',
    normal: '200ms',
    medium: '300ms',
    slow: '500ms',
    slower: '700ms',
  },

  // Timing Functions
  timingFunction: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  },

  // Keyframe Animations
  keyframes: {
    // Fade animations
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    fadeOut: {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },

    // Slide animations
    slideInRight: {
      '0%': { transform: 'translateX(100%)' },
      '100%': { transform: 'translateX(0)' },
    },
    slideInLeft: {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(0)' },
    },
    slideInUp: {
      '0%': { transform: 'translateY(100%)' },
      '100%': { transform: 'translateY(0)' },
    },
    slideInDown: {
      '0%': { transform: 'translateY(-100%)' },
      '100%': { transform: 'translateY(0)' },
    },

    // Scale animations
    scaleIn: {
      '0%': { transform: 'scale(0.9)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' },
    },
    scaleOut: {
      '0%': { transform: 'scale(1)', opacity: '1' },
      '100%': { transform: 'scale(0.9)', opacity: '0' },
    },

    // Bounce animation
    bounce: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10%)' },
    },

    // Spin animation
    spin: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },

    // Pulse animation
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },

    // Shimmer animation (for loading states)
    shimmer: {
      '0%': { backgroundPosition: '-1000px 0' },
      '100%': { backgroundPosition: '1000px 0' },
    },

    // Progress animation
    progress: {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(100%)' },
    },
  },

  // Animation configurations
  animation: {
    fadeIn: 'fadeIn 200ms ease-out',
    fadeOut: 'fadeOut 200ms ease-in',
    slideInRight: 'slideInRight 300ms ease-out',
    slideInLeft: 'slideInLeft 300ms ease-out',
    slideInUp: 'slideInUp 300ms ease-out',
    slideInDown: 'slideInDown 300ms ease-out',
    scaleIn: 'scaleIn 200ms ease-out',
    scaleOut: 'scaleOut 200ms ease-in',
    bounce: 'bounce 1s infinite',
    spin: 'spin 1s linear infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    shimmer: 'shimmer 2s linear infinite',
    progress: 'progress 1s ease-in-out infinite',
  },
};

// Predefined transition patterns
export const transitionPatterns = {
  // Common transitions
  all: 'transition-all duration-200 ease-in-out',
  colors: 'transition-colors duration-200 ease-in-out',
  opacity: 'transition-opacity duration-200 ease-in-out',
  shadow: 'transition-shadow duration-200 ease-in-out',
  transform: 'transition-transform duration-200 ease-in-out',

  // Hover effects
  hoverScale: 'transition-transform duration-200 hover:scale-105',
  hoverShadow: 'transition-shadow duration-200 hover:shadow-lg',
  hoverOpacity: 'transition-opacity duration-200 hover:opacity-80',

  // Button transitions
  button: 'transition-all duration-150 ease-in-out',
  buttonSlow: 'transition-all duration-300 ease-in-out',

  // Modal/Dialog transitions
  modal: 'transition-all duration-300 ease-out',
  modalBackdrop: 'transition-opacity duration-200 ease-out',

  // Drawer/Sidebar transitions
  drawer: 'transition-transform duration-300 ease-in-out',

  // Dropdown transitions
  dropdown: 'transition-all duration-200 ease-out',
};

export default animations;
