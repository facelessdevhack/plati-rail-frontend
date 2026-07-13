/**
 * Top Navigation Route Configuration
 *
 * Structure: Primary nav sections → Sub-nav items
 * Each primary section maps to a set of sub-navigation tabs shown below the top bar.
 *
 * Route paths are used for matching the active section/tab based on useLocation().
 */

export const topNavSections = [
  {
    key: 'production',
    label: 'Production',
    defaultPath: '/production-plans-v2',
    allowedRoles: [4, 5, 6, 999],
    subNav: [
      { key: 'prod-plans-v2', label: 'Plans V2', path: '/production-plans-v2', icon: 'file' },
      { key: 'prod-smart', label: 'Smart Planner', path: '/smart-production', icon: 'rocket' },
      { key: 'prod-job-cards', label: 'Job Cards', path: '/job-cards', icon: 'tool' },
      { key: 'prod-presets', label: 'Presets', path: '/production-presets', icon: 'setting' },
      { key: 'prod-inv-requests', label: 'Inventory Requests', path: '/inventory-requests', icon: 'database' },
      { key: 'prod-dispatch', label: 'Dispatch to Sales', path: '/dispatch-to-sales', icon: 'truck' },
      { key: 'prod-rejected', label: 'Rejected Stock', path: '/rejected-stock', icon: 'warning' },
      { key: 'prod-discarded', label: 'Discarded Stock', path: '/discarded-stock-management', icon: 'delete' },
      { key: 'prod-user-steps', label: 'User Steps', path: '/user-production-steps', icon: 'team' },
      { key: 'prod-equipment', label: 'Equipment', path: '/equipment-management', icon: 'setting' },
      { key: 'prod-step-mapping', label: 'Step Mapping', path: '/step-position-mapping', icon: 'environment' },
    ]
  },
  {
    key: 'sales',
    label: 'Sales',
    defaultPath: '/admin-dashboard',
    allowedRoles: [3, 4, 5, 999],
    subNav: [
      { key: 'sales-dashboard', label: 'Dashboard', path: '/admin-dashboard', icon: 'dashboard', allowedRoles: [5, 999] },
      { key: 'sales-daily-entries', label: 'Daily Entries', path: '/admin-daily-entry-dealers', icon: 'file' },
      { key: 'sales-warranty', label: 'Warranty', path: '/dealer-warranty', icon: 'safety' },
      { key: 'sales-price-lists', label: 'Price Lists', path: '/price-lists', icon: 'tags' },
    ]
  },
  {
    key: 'sales-coordination',
    label: 'Sales Coordination',
    defaultPath: '/sales-create-order',
    allowedRoles: [3, 4, 5, 7, 999],
    subNav: [
      { key: 'sc-create-order', label: 'Create Order', path: '/sales-create-order', icon: 'edit' },
      { key: 'sc-dispatch', label: 'Dispatch Entries', path: '/sales-dispatch-entries', icon: 'package' },
      { key: 'sc-pending', label: 'Pending', path: '/sales-pending-entries', icon: 'clock' },
      { key: 'sc-inprod', label: 'In-Production', path: '/sales-inprod-entries', icon: 'factory' },
      { key: 'sc-pricing', label: 'Pricing Entries', path: '/data-entry-pricing', icon: 'invoice', allowedRoles: [3, 4, 5, 999] },
    ]
  },
  {
    key: 'data-entry',
    label: 'Data Entry',
    defaultPath: '/entry-dashboard',
    allowedRoles: [3, 999],
    subNav: [
      { key: 'de-dashboard', label: 'Dashboard', path: '/entry-dashboard', icon: 'dashboard' },
      { key: 'de-daily-entries', label: 'Daily Entries', path: '/add-daily-entry', icon: 'edit' },
      { key: 'de-inwards', label: 'Inwards Entry', path: '/add-inwards-entry', icon: 'inbox' },
      { key: 'de-dealers', label: 'Dealers', path: '/dealers-list', icon: 'team' },
    ]
  },
  {
    key: 'inventory',
    label: 'Inventory',
    defaultPath: '/inventory-locations',
    allowedRoles: [3, 4, 5, 6, 999],
    subNav: [
      { key: 'inv-locations', label: 'Locations', path: '/inventory-locations', icon: 'environment' },
      { key: 'inv-movements', label: 'Movements', path: '/inventory-movements', icon: 'swap' },
    ]
  },
  {
    key: 'purchase',
    label: 'Purchase',
    defaultPath: '/purchase/requisitions',
    allowedRoles: [5, 8, 9, 10, 999],
    subNav: [
      { key: 'pur-vendor-purchases', label: 'Vendor Purchases', path: '/purchase/vendor-purchases', icon: 'truck' },
      { key: 'pur-requisitions', label: 'Requisitions', path: '/purchase/requisitions', icon: 'audit' },
      { key: 'pur-submit', label: 'Submit Request', path: '/purchase/requisitions/create', icon: 'form' },
      { key: 'pur-indents', label: 'Indents', path: '/purchase/indents', icon: 'unordered-list' },
      { key: 'pur-po', label: 'Purchase Orders', path: '/purchase/po', icon: 'file' },
      { key: 'pur-grn', label: 'GRN', path: '/purchase/grn', icon: 'inbox' },
      { key: 'pur-items', label: 'Items Master', path: '/purchase/items', icon: 'appstore' },
      { key: 'pur-categories', label: 'Categories', path: '/purchase/item-categories', icon: 'tags' },
      { key: 'pur-molds', label: 'Mold Management', path: '/mold-management', icon: 'tool' },
    ]
  },
  {
    key: 'finance',
    label: 'Finance',
    defaultPath: '/profit-dashboard',
    allowedRoles: [4, 5, 999],
    subNav: [
      { key: 'fin-profit', label: 'Profit Dashboard', path: '/profit-dashboard', icon: 'line-chart' },
      { key: 'fin-pnl', label: 'P&L Dashboard', path: '/pnl-dashboard', icon: 'line-chart' },
      { key: 'fin-ceo', label: 'CEO Dashboard', path: '/ceo-dashboard', icon: 'crown' },
      { key: 'fin-categories', label: 'Cost Categories', path: '/cost-categories', icon: 'setting' },
      { key: 'fin-overheads', label: 'Monthly Overheads', path: '/monthly-overheads', icon: 'bank' },
      { key: 'fin-costing', label: 'Product Costing', path: '/temp-costing', icon: 'calculator' },
    ]
  },
  {
    key: 'access-control',
    label: 'Access Control',
    defaultPath: '/access-control',
    allowedRoles: [5, 999],
    allowedPermissions: ['users.view', 'roles.view'],
    subNav: [
      {
        key: 'access-control-console',
        label: 'Users & Roles',
        path: '/access-control',
        icon: 'safety',
        allowedPermissions: ['users.view', 'roles.view']
      }
    ]
  }
]

/**
 * Where each role lands after login. Single source of truth — used by the
 * post-login redirect in StackNavigation. Keep in sync with the sections
 * above when adding a role.
 */
export const roleLandingPaths = {
  999: '/admin-dashboard',
  5: '/admin-dashboard',
  7: '/sales-coordinator-dashboard',
  3: '/entry-dashboard',
  6: '/production-dashboard',
  4: '/admin-daily-entry-dealers',
  // Roles 1/2 have no dedicated dashboard; sales-coordinator-dashboard is
  // the one route their allowedRoles include.
  1: '/sales-coordinator-dashboard',
  2: '/sales-coordinator-dashboard',
  8: '/purchase/indents',
  9: '/purchase/requisitions',
  10: '/purchase/indents',
}

/**
 * Find which primary section and sub-nav item is active based on the current path
 */
export function getActiveNav(pathname) {
  for (const section of topNavSections) {
    for (const item of section.subNav) {
      if (pathname === item.path || pathname.startsWith(item.path + '/')) {
        return { section: section.key, subNavKey: item.key }
      }
    }
  }

  // Check defaultPaths as fallback
  for (const section of topNavSections) {
    if (pathname === section.defaultPath) {
      return { section: section.key, subNavKey: section.subNav[0]?.key }
    }
  }

  return { section: null, subNavKey: null }
}

/**
 * Filter sections based on user role.
 * Sub-nav items may carry their own allowedRoles when the route behind them is
 * stricter than the section (e.g. /admin-dashboard is 5/999 while the Sales
 * section is visible to 3/4 too). The section's defaultPath resolves to the
 * first sub-nav item the role can actually open, so clicking a section never
 * lands on /unauthorized.
 */
export function getSectionsForRole(roleId, permissions = []) {
  const id = Number(roleId)
  const permissionSet = new Set(permissions)
  const isAllowed = item =>
    item.allowedRoles?.includes(id) ||
    item.allowedPermissions?.some(permission => permissionSet.has(permission))

  return topNavSections
    .filter(isAllowed)
    .map(section => {
      const subNav = section.subNav.filter(
        item =>
          (!item.allowedRoles && !item.allowedPermissions) ||
          isAllowed(item)
      )
      return { ...section, subNav, defaultPath: subNav[0]?.path || section.defaultPath }
    })
    .filter(section => section.subNav.length > 0)
}
