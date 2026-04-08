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
    defaultPath: '/production-dashboard',
    allowedRoles: [4, 5, 6, 999],
    subNav: [
      { key: 'prod-dashboard', label: 'Dashboard', path: '/production-dashboard', icon: 'dashboard' },
      { key: 'prod-plans', label: 'Production Plans', path: '/production-plans', icon: 'file' },
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
      { key: 'sales-dashboard', label: 'Dashboard', path: '/admin-dashboard', icon: 'dashboard' },
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
      { key: 'sc-pricing', label: 'Pricing Entries', path: '/data-entry-pricing', icon: 'invoice' },
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
  }
]

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
 * Filter sections based on user role
 */
export function getSectionsForRole(roleId) {
  const id = Number(roleId)
  return topNavSections.filter(section => section.allowedRoles.includes(id))
}
