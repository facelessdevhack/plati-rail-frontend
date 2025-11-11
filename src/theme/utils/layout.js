/**
 * PlatiSystem Design System - Layout Utilities
 *
 * Common layout patterns and utilities
 */

export const layoutPatterns = {
  // Container patterns
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  containerFluid: 'w-full px-4 sm:px-6 lg:px-8',
  containerNarrow: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
  containerWide: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

  // Flexbox patterns
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexStart: 'flex items-center justify-start',
  flexEnd: 'flex items-center justify-end',
  flexCol: 'flex flex-col',
  flexColCenter: 'flex flex-col items-center justify-center',

  // Grid patterns
  grid2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  grid3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  grid4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
  gridAuto: 'grid grid-cols-auto-fit gap-4',

  // Page layouts
  pageWrapper: 'min-h-screen bg-background-secondary',
  pageHeader: 'bg-white border-b border-border-light px-6 py-4',
  pageContent: 'p-6',
  pageFooter: 'bg-white border-t border-border-light px-6 py-4',

  // Sidebar layouts
  sidebarLayout: 'flex h-screen overflow-hidden',
  sidebarMain: 'flex-1 overflow-y-auto',
  sidebarAside: 'w-64 bg-background-sidebar text-white overflow-y-auto',

  // Dashboard layouts
  dashboardGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
  dashboardCard: 'bg-white rounded-lg shadow-sm p-6',
  dashboardHeader: 'flex items-center justify-between mb-6',
  dashboardStats: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',

  // Table layouts
  tableWrapper: 'overflow-x-auto bg-white rounded-lg shadow-sm',
  tableResponsive: 'min-w-full divide-y divide-border-light',

  // Modal/Dialog layouts
  modalOverlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
  modalContent: 'bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4',
  modalHeader: 'px-6 py-4 border-b border-border-light',
  modalBody: 'px-6 py-4',
  modalFooter: 'px-6 py-4 border-t border-border-light flex justify-end gap-3',
};

export const responsivePatterns = {
  // Responsive visibility
  showOnMobile: 'block sm:hidden',
  showOnTablet: 'hidden sm:block lg:hidden',
  showOnDesktop: 'hidden lg:block',
  hideOnMobile: 'hidden sm:block',
  hideOnTablet: 'block sm:hidden lg:block',
  hideOnDesktop: 'block lg:hidden',

  // Responsive text
  textResponsive: 'text-sm sm:text-base lg:text-lg',
  headingResponsive: 'text-2xl sm:text-3xl lg:text-4xl',

  // Responsive spacing
  paddingResponsive: 'p-4 sm:p-6 lg:p-8',
  marginResponsive: 'm-4 sm:m-6 lg:m-8',
  gapResponsive: 'gap-2 sm:gap-4 lg:gap-6',
};

export const scrollPatterns = {
  scrollVertical: 'overflow-y-auto',
  scrollHorizontal: 'overflow-x-auto',
  scrollBoth: 'overflow-auto',
  scrollHidden: 'overflow-hidden',
  scrollSmooth: 'scroll-smooth',
  scrollSnap: 'snap-y snap-mandatory',
  scrollSnapItem: 'snap-start',
};

export const positionPatterns = {
  sticky: 'sticky top-0 z-10',
  stickyHeader: 'sticky top-0 z-20 bg-white shadow-sm',
  fixedTop: 'fixed top-0 left-0 right-0 z-50',
  fixedBottom: 'fixed bottom-0 left-0 right-0 z-50',
  absoluteCenter: 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
  absoluteTopRight: 'absolute top-4 right-4',
  absoluteTopLeft: 'absolute top-4 left-4',
  absoluteBottomRight: 'absolute bottom-4 right-4',
  absoluteBottomLeft: 'absolute bottom-4 left-4',
};

export default {
  layoutPatterns,
  responsivePatterns,
  scrollPatterns,
  positionPatterns,
};
