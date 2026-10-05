import { getActiveNav, getLandingPath, getSectionsForRole } from './topNavRoutes'

test.each(['warranty.register', 'warranty.manage'])('a custom %s grant exposes Warranty in Sales Coordination without unrelated pages', permission => {
  const sections = getSectionsForRole(54, [permission])
  const coordination = sections.find(section => section.key === 'sales-coordination')
  expect(coordination.subNav.map(item => item.path)).toEqual(['/dealer-warranty'])
  expect(coordination.defaultPath).toBe('/dealer-warranty')
  expect(sections.find(section => section.key === 'sales')).toBeUndefined()
})

test.each([3, 4, 5, 999])('moves Warranty into Sales Coordination for existing role %s', role => {
  const sections = getSectionsForRole(role)
  expect(sections.find(section => section.key === 'sales-coordination').subNav.some(item => item.path === '/dealer-warranty')).toBe(true)
  expect(sections.find(section => section.key === 'sales').subNav.some(item => item.path === '/dealer-warranty')).toBe(false)
})

test('Sales Coordination membership does not grant Warranty access', () => {
  const coordination = getSectionsForRole(7).find(section => section.key === 'sales-coordination')
  expect(coordination.subNav.map(item => item.path)).toEqual(['/sales-create-order', '/sales-dispatch-entries', '/sales-pending-entries', '/sales-inprod-entries'])
  expect(getSectionsForRole(7, ['warranty.register']).find(section => section.key === 'sales-coordination').subNav.some(item => item.path === '/dealer-warranty')).toBe(true)
})

test.each(['/dealer-warranty', '/dealer-warranty/edit/123'])('keeps Sales Coordination active on %s', path => {
  expect(getActiveNav(path)).toEqual({ section: 'sales-coordination', subNavKey: 'sc-warranty' })
})

test('warranty claim grants keep their separate navigation and do not grant registration access', () => {
  expect(getSectionsForRole(54, ['warranty_claims.view']).map(section => section.key)).toEqual(['warranty-claims'])
  expect(getActiveNav('/warranty-claims/123').section).toBe('warranty-claims')
})

const hasSalesDashboard = (roleId, permissions = []) =>
  getSectionsForRole(roleId, permissions).some(section =>
    section.subNav.some(item => item.path === '/admin-dashboard')
  )

describe('Sales Dashboard access', () => {
  test('requires a personal Sales Overview grant for Admin accounts', () => {
    expect(hasSalesDashboard(5)).toBe(false)
    expect(hasSalesDashboard(5, ['dashboard.view', 'dashboard.analytics'])).toBe(false)
    expect(hasSalesDashboard(5, ['sales.overview.view'])).toBe(true)
    expect(hasSalesDashboard(999)).toBe(true)
  })

  test('restricted Admin accounts keep their other pages and land on Daily Entries', () => {
    const sales = getSectionsForRole(5).find(section => section.key === 'sales')
    expect(sales.subNav.map(item => item.path)).toEqual(['/admin-daily-entry-dealers', '/price-lists'])
    expect(sales.defaultPath).toBe('/admin-daily-entry-dealers')
    expect(getLandingPath(5)).toBe('/admin-daily-entry-dealers')
    expect(getLandingPath(5, ['sales.overview.view'])).toBe('/admin-dashboard')
    expect(getLandingPath(999)).toBe('/admin-dashboard')
    expect(getLandingPath(4)).toBe('/admin-daily-entry-dealers')
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

const getFinancePaths = (roleId, permissions = []) =>
  getSectionsForRole(roleId, permissions)
    .flatMap(section => section.subNav)
    .map(item => item.path)
    .filter(path => financePaths.includes(path))

describe('Finance access', () => {
  test.each([5, 999])('shows the single P&L dashboard and Finance tools to admin role %s', roleId => {
    expect(getFinancePaths(roleId, ['costing.view'])).toEqual(financePaths)
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

const getCostingProcessPaths = (roleId, permissions = []) =>
  getSectionsForRole(roleId, permissions)
    .find(section => section.key === 'costing-process')
    ?.subNav.map(item => item.path) || []

describe('Costing Process access', () => {
  test.each([5, 999])('shows the costing workflow to admin role %s', roleId => {
    expect(getCostingProcessPaths(roleId, ['costing.view'])).toEqual(costingProcessPaths)
  })

  test.each([1, 2, 3, 4, 6, 7, 8, 9, 10])(
    'hides the costing workflow from non-admin role %s',
    roleId => {
      expect(getCostingProcessPaths(roleId)).toEqual([])
    }
  )
})

test('an Admin without costing grants keeps operational pages but loses all costing navigation', () => {
  expect(getFinancePaths(5)).toEqual([])
  expect(getCostingProcessPaths(5)).toEqual([])
  const keys = getSectionsForRole(5).map(section => section.key)
  expect(keys).toEqual(expect.arrayContaining(['production', 'sales', 'inventory', 'purchase']))
})
