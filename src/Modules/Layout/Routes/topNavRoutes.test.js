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
  '/profit-dashboard',
  '/pnl-dashboard',
  '/ceo-dashboard',
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
  test.each([5, 999])('shows every Finance page to admin role %s', roleId => {
    expect(getFinancePaths(roleId)).toEqual(financePaths)
  })

  test.each([1, 2, 3, 4, 6, 7, 8, 9, 10])(
    'hides every Finance page from non-admin role %s',
    roleId => {
      expect(getFinancePaths(roleId)).toEqual([])
    }
  )
})
