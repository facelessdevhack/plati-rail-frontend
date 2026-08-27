import { getSectionsForRole } from './topNavRoutes'

const hasSalesDashboard = roleId =>
  getSectionsForRole(roleId).some(section =>
    section.subNav.some(item => item.path === '/admin-dashboard')
  )

describe('Sales Dashboard access', () => {
  test.each([5, 999])('shows the dashboard to admin role %s', roleId => {
    expect(hasSalesDashboard(roleId)).toBe(true)
  })

  test.each([1, 2, 3, 4, 6, 7, 8, 9, 10])(
    'hides the dashboard from non-admin role %s',
    roleId => {
      expect(hasSalesDashboard(roleId)).toBe(false)
    }
  )
})

const financePaths = [
  '/pnl-dashboard',
  '/cost-categories',
  '/monthly-overheads',
  '/temp-costing'
]

const getFinancePaths = roleId =>
  getSectionsForRole(roleId)
    .flatMap(section => section.subNav)
    .map(item => item.path)
    .filter(path => financePaths.includes(path))

describe('Finance access', () => {
  test.each([5, 999])('shows the single P&L dashboard and Finance tools to admin role %s', roleId => {
    expect(getFinancePaths(roleId)).toEqual(financePaths)
  })

  test.each([1, 2, 3, 4, 6, 7, 8, 9, 10])(
    'hides every Finance page from non-admin role %s',
    roleId => {
      expect(getFinancePaths(roleId)).toEqual([])
    }
  )
})

const costingProcessPaths = [
  '/costing/step-1-opening-stock',
  '/costing/step-3-production-costing',
  '/costing/step-4-july-sales-lineage',
  '/costing/sources/raw-purchases',
  '/costing/sources/fmbk-inventory-in',
  '/costing/sources/erp-inventory-in',
  '/costing/sources/adjustments',
  '/costing/sources/restorations',
  '/costing/sources/opening-stock',
  '/costing/sources/production',
  '/costing/product-movement-pricing',
  '/costing/tally-backup'
]

const getCostingProcessPaths = roleId =>
  getSectionsForRole(roleId)
    .find(section => section.key === 'costing-process')
    ?.subNav.map(item => item.path) || []

describe('Costing Process access', () => {
  test.each([5, 999])('shows the costing workflow to admin role %s', roleId => {
    expect(getCostingProcessPaths(roleId)).toEqual(costingProcessPaths)
  })

  test.each([1, 2, 3, 4, 6, 7, 8, 9, 10])(
    'hides the costing workflow from non-admin role %s',
    roleId => {
      expect(getCostingProcessPaths(roleId)).toEqual([])
    }
  )
})
