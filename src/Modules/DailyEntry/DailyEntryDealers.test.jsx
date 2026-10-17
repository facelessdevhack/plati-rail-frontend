import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { message } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import * as XLSX from 'xlsx'
import { client } from '../../Utils/axiosClient'
import { getAllDealers } from '../../redux/api/stockAPI'
import DailyEntryDealers from './DailyEntryDealers'

jest.mock('react-redux', () => ({ useDispatch: jest.fn(), useSelector: jest.fn() }))
let mockSearchParams
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useSearchParams: () => [mockSearchParams],
}))
jest.mock('../../Utils/axiosClient', () => ({ client: { get: jest.fn() } }))
jest.mock('../../redux/api/stockAPI', () => ({ getAllDealers: jest.fn() }))
jest.mock('xlsx', () => ({ ...jest.requireActual('xlsx'), writeFile: jest.fn() }))
jest.mock('../../Core/Components/DataTablePagination', () => () => null)
jest.mock('../../Core/Components/FilterBar', () => ({ searchText, onSearchChange, exportMenuItems }) => (
  <div>
    <input aria-label="Search dealers" value={searchText} onChange={event => onSearchChange(event.target.value)} />
    {exportMenuItems.map(item => <button key={item.key} disabled={item.disabled} onClick={item.onClick}>{item.label}</button>)}
  </div>
))

let mockUser
beforeEach(() => {
  jest.clearAllMocks()
  mockUser = { roleId: 5, userId: 12 }
  mockSearchParams = new URLSearchParams()
  useDispatch.mockReturnValue(jest.fn().mockResolvedValue({}))
  useSelector.mockImplementation(selector => selector({
    userDetails: { user: mockUser },
    stockDetails: {
      allDealers: [{ value: 3, label: 'No overdue dealer', overdueAmount: 0 }],
      dealersPagination: { total: 1 },
    },
  }))
  jest.spyOn(message, 'info').mockImplementation(() => {})
  jest.spyOn(message, 'error').mockImplementation(() => {})
  jest.spyOn(message, 'success').mockImplementation(() => {})
})
afterEach(() => jest.restoreAllMocks())

const page = (dealers, hasNextPage = false) => ({ data: { data: dealers, pagination: { hasNextPage } } })
const exportButton = () => screen.getByRole('button', { name: 'Overdue only (Excel)' })

test('exports every overdue page with the current search, without replacing the displayed dealer list', async () => {
  client.get.mockResolvedValueOnce(page([{ label: 'Plati- Bengaluru', overdueAmount: '151946.25' }], true))
    .mockResolvedValueOnce(page([{ label: '=Dealer & Sons', overdueAmount: '75097' }]))
  render(<DailyEntryDealers />)
  fireEvent.change(screen.getByLabelText('Search dealers'), { target: { value: 'Plati & Sons' } })
  const listingCalls = getAllDealers.mock.calls.length
  fireEvent.click(exportButton())
  expect(screen.getByRole('button', { name: 'Exporting overdue…' })).toBeDisabled()
  await waitFor(() => expect(XLSX.writeFile).toHaveBeenCalledTimes(1))
  expect(client.get.mock.calls).toEqual([1, 2].map(page => ['/master/all-dealers', {
    params: { salesId: undefined, search: 'Plati & Sons', overdue: true, page, limit: 100 },
  }]))
  const [workbook, filename] = XLSX.writeFile.mock.calls[0]
  expect(filename).toBe('Overdue_Dealers.xlsx')
  expect(XLSX.utils.sheet_to_json(workbook.Sheets['Overdue Dealers'])).toEqual([
    { Dealer: 'Plati- Bengaluru', 'Overdue Amount (INR)': 151946.25 },
    { Dealer: '=Dealer & Sons', 'Overdue Amount (INR)': 75097 },
  ])
  expect(workbook.Sheets['Overdue Dealers'].A3).toMatchObject({ t: 's', v: '=Dealer & Sons' })
  expect(workbook.Sheets['Overdue Dealers'].A3.f).toBeUndefined()
  expect(getAllDealers).toHaveBeenCalledTimes(listingCalls)
  expect(screen.getByText('No overdue dealer')).toBeInTheDocument()
  expect(exportButton()).toBeEnabled()
})

test.each([
  [4, '', 12],
  [5, 'salesId=77&overdue=true', '77'],
])('preserves listing salesperson scope for role %s and query %s', async (roleId, query, salesId) => {
  mockUser.roleId = roleId
  mockSearchParams = new URLSearchParams(query)
  client.get.mockResolvedValue(page([]))
  render(<DailyEntryDealers />)
  fireEvent.click(exportButton())
  await waitFor(() => expect(message.info).toHaveBeenCalledWith('No overdue dealers to export.'))
  expect(getAllDealers).toHaveBeenCalledWith(expect.objectContaining({ id: salesId }))
  expect(client.get).toHaveBeenCalledWith('/master/all-dealers', {
    params: { salesId, search: undefined, overdue: true, page: 1, limit: 100 },
  })
  expect(XLSX.writeFile).not.toHaveBeenCalled()
})

test('a failed later page downloads no partial report and allows a retry', async () => {
  client.get.mockResolvedValueOnce(page([{ label: 'First dealer', overdueAmount: '100' }], true))
    .mockRejectedValueOnce(new Error('Network unavailable'))
  render(<DailyEntryDealers />)
  fireEvent.click(exportButton())
  await waitFor(() => expect(message.error).toHaveBeenCalledWith('Could not export overdue dealers. Please try again.'))
  expect(XLSX.writeFile).not.toHaveBeenCalled()
  expect(exportButton()).toBeEnabled()
  client.get.mockResolvedValueOnce(page([{ label: 'First dealer', overdueAmount: '100' }]))
  fireEvent.click(exportButton())
  await waitFor(() => expect(XLSX.writeFile).toHaveBeenCalledTimes(1))
})
