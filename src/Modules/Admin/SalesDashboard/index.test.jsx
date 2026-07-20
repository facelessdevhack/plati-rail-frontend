import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import AdminSalesDashboard from './index'
import { useAdminDashboard } from '../../../hooks/useAdminDashboard'

jest.mock('../../../hooks/useAdminDashboard', () => ({
  useAdminDashboard: jest.fn()
}))

jest.mock('antd', () => {
  const React = require('react')
  const Empty = () => <div>No data</div>
  Empty.PRESENTED_IMAGE_SIMPLE = 'simple'
  return {
    Alert: ({ message }) => <div>{message}</div>,
    DatePicker: { RangePicker: () => <div data-testid='date-range' /> },
    Empty,
    Select: ({ value }) => <div data-testid='select'>{value}</div>,
    Spin: () => <div>Loading</div>
  }
})

jest.mock('@ant-design/plots', () => ({
  Line: props => (
    <div
      data-testid='revenue-chart'
      data-x-field={props.xField}
      data-y-field={props.yField}
      data-color-field={props.colorField}
      data-current-dash={(props.style.lineDash([{ series: 'Current Period' }]) || []).join(',')}
      data-previous-dash={(props.style.lineDash([{ series: 'Previous Period' }]) || []).join(',')}
    />
  ),
  Bar: props => (
    <div
      data-testid='units-chart'
      data-x-field={props.xField}
      data-y-field={props.yField}
    />
  ),
  Pie: props => (
    <div
      data-testid='claims-chart'
      data-start-angle={props.startAngle}
      data-end-angle={props.endAngle}
      data-inner-radius={props.innerRadius}
    />
  )
}))

const updateFilters = jest.fn()
const setChartPeriod = jest.fn()

const dashboardData = {
  overview: {
    totalRevenue: 74500000,
    revenueGrowth: 8.2,
    averageOrderValue: 36077,
    totalUnits: 8851,
    unitsGrowth: 5.6,
    stockDelayedUnits: 82,
    stockDelayedOrders: 4,
    overdueAmount: 87000000,
    criticalDealers: 3,
    activeDealers: 167,
    totalDealers: 352,
    newAcquisitions: 13,
    dormantDealers: 107
  },
  trends: {
    revenue: [
      { bucket: 1, period: '2026-01', series: 'Current Period', revenue: 1000000 },
      { bucket: 2, period: '2026-02', series: 'Current Period', revenue: 1200000 },
      { bucket: 1, period: '2025-01', series: 'Previous Period', revenue: 900000 },
      { bucket: 2, period: '2025-02', series: 'Previous Period', revenue: 1100000 }
    ],
    units: [
      { period: '2026-01', units: 5000 },
      { period: '2026-02', units: 6200 }
    ]
  },
  overdue: { byDealer: [], bySalesPerson: [] },
  productPerformance: {
    models: { top: [], bottom: [] },
    sizes: { top: [] },
    finishes: { top: [] },
    designs: { top: [], bottom: [] }
  },
  dealerPerformance: { topDealers: [], newDealers: [], dormantDealers: [] },
  salesTeamPerformance: [],
  warranty: {
    registrations: 250,
    registrationGrowth: 4.2,
    registrationRate: 12.5,
    claims: 12,
    claimsGrowth: -2.1,
    claimRate: 0.11,
    bottomDealers: [],
    claimsByType: [
      { type: 'Alloy claims', value: 8 },
      { type: 'Tyre claims', value: 4 }
    ]
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  useAdminDashboard.mockReturnValue({
    data: dashboardData,
    loading: false,
    error: null,
    filters: {
      startDate: '2025-08-01',
      endDate: '2026-07-20',
      chartPeriod: 'monthly',
      dealerType: 'all'
    },
    updateFilters,
    setDateRange: jest.fn(),
    setChartPeriod,
    refresh: jest.fn()
  })
})

test('renders Figma-aligned revenue and units graph configuration', () => {
  render(<MemoryRouter><AdminSalesDashboard /></MemoryRouter>)

  const revenue = screen.getByTestId('revenue-chart')
  expect(revenue).toHaveAttribute('data-x-field', 'bucket')
  expect(revenue).toHaveAttribute('data-y-field', 'revenue')
  expect(revenue).toHaveAttribute('data-color-field', 'series')
  expect(revenue).toHaveAttribute('data-current-dash', '')
  expect(revenue).toHaveAttribute('data-previous-dash', '7,6')

  const units = screen.getByTestId('units-chart')
  expect(units).toHaveAttribute('data-x-field', 'period')
  expect(units).toHaveAttribute('data-y-field', 'units')
  expect(screen.getByText('Current Period')).toBeInTheDocument()
  expect(screen.getByText('Previous Period')).toBeInTheDocument()
})

test('switches graph period, channel, dashboard sections, and claim graph', () => {
  render(<MemoryRouter><AdminSalesDashboard /></MemoryRouter>)

  fireEvent.click(screen.getByRole('tab', { name: 'Weekly' }))
  expect(setChartPeriod).toHaveBeenCalledWith('weekly')

  fireEvent.click(screen.getByRole('tab', { name: 'D2C' }))
  expect(updateFilters).toHaveBeenCalledWith({ dealerType: 'd2c' })

  fireEvent.click(screen.getByRole('tab', { name: 'Product Performance' }))
  expect(screen.getByText('Top Performing Models')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('tab', { name: 'Dealer Performance' }))
  expect(screen.getByText('Top Dealers')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('tab', { name: 'Sales Team Performance' }))
  expect(screen.getByText('Sales Rep. Performance')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('tab', { name: 'Warranty' }))
  const claims = screen.getByTestId('claims-chart')
  expect(claims).toHaveAttribute('data-start-angle', String(Math.PI))
  expect(claims).toHaveAttribute('data-end-angle', String(Math.PI * 2))
  expect(claims).toHaveAttribute('data-inner-radius', '0.68')
  expect(screen.getByLabelText('Claim rate 0.11 percent')).toBeInTheDocument()
})
