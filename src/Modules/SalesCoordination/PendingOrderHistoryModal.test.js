import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PendingOrderHistoryModal from './PendingOrderHistoryModal'
import { getPendingEntryOrderHistoryAPI } from '../../redux/api/entriesAPI'

jest.mock('../../redux/api/entriesAPI', () => ({ getPendingEntryOrderHistoryAPI: jest.fn() }))
// Keep these tests about our paging, errors and request lifetimes. Ant Design's
// layout/portal measurements require a browser and can loop in CRA's old jsdom.
jest.mock('antd', () => ({
  Modal: ({ title, children }) => <section aria-label={title}>{children}</section>,
  Button: ({ onClick, children }) => <button onClick={onClick}>{children}</button>,
  Alert: ({ message, action }) => <div role="alert">{message}{action}</div>,
  Table: ({ columns, dataSource, pagination, loading }) => loading ? <p>Loading...</p> : (
    <div>
      <table><tbody>{dataSource.map(row => <tr key={row.id}>{columns.map(column => (
        <td key={column.dataIndex}>{column.render ? column.render(row[column.dataIndex]) : row[column.dataIndex]}</td>
      ))}</tr>)}</tbody></table>
      <button title="Next Page" disabled={pagination.current * pagination.pageSize >= pagination.total}
        onClick={() => pagination.onChange(pagination.current + 1)}>Next</button>
    </div>
  )
}))

const entry = { id: 42, dealerName: 'Test dealer', productName: 'Test alloy', quantity: 4, orderCount: 21 }
const event = { id: 1, recordedAt: '2026-09-12T06:30:00Z', orderedAt: '2026-09-11T07:00:00Z', quantity: 6, createdBy: 3, sourcePendingEntryId: 42, pendingStatus: 'awaiting_stock' }

beforeEach(() => {
  getPendingEntryOrderHistoryAPI.mockReset()
})

test('shows repeat counts, submitted quantity and IST timestamps; loads subsequent pages on demand', async () => {
  getPendingEntryOrderHistoryAPI.mockResolvedValue({ history: [event], total: 21 })
  render(<PendingOrderHistoryModal entry={entry} onClose={jest.fn()} />)
  expect(screen.getByText(/21 times ordered · Pending quantity: 4/)).toBeInTheDocument()
  expect(await screen.findByText('12 Sep 2026 12:00 PM')).toBeInTheDocument()
  expect(screen.getByText('11 Sep 2026 12:30 PM')).toBeInTheDocument()
  expect(screen.getByText('6')).toBeInTheDocument()
  expect(screen.getByText('Awaiting stock')).toBeInTheDocument()
  expect(getPendingEntryOrderHistoryAPI).toHaveBeenCalledWith({ pendingEntryId: 42, page: 1, pageSize: 20 })
  fireEvent.click(screen.getByTitle('Next Page'))
  await waitFor(() => expect(getPendingEntryOrderHistoryAPI).toHaveBeenLastCalledWith({ pendingEntryId: 42, page: 2, pageSize: 20 }))
  expect(await screen.findByText('12 Sep 2026 12:00 PM')).toBeInTheDocument()
})

test('a failed history request can be retried without closing the dialog', async () => {
  getPendingEntryOrderHistoryAPI.mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ history: [event], total: 1 })
  render(<PendingOrderHistoryModal entry={entry} onClose={jest.fn()} />)
  expect(await screen.findByText('Could not load order history.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByText('12 Sep 2026 12:00 PM')).toBeInTheDocument()
  expect(screen.queryByText('Could not load order history.')).not.toBeInTheDocument()
})

test('closing one entry and opening another ignores the stale history response', async () => {
  let resolveOld
  getPendingEntryOrderHistoryAPI.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
    .mockResolvedValueOnce({ history: [{ ...event, id: 2, quantity: 9 }], total: 1 })
  const { rerender } = render(<PendingOrderHistoryModal key={42} entry={entry} onClose={jest.fn()} />)
  rerender(<PendingOrderHistoryModal key={43} entry={{ ...entry, id: 43 }} onClose={jest.fn()} />)
  expect(await screen.findByText('9')).toBeInTheDocument()
  await act(async () => resolveOld({ history: [event], total: 21 }))
  expect(screen.getByText('9')).toBeInTheDocument()
  expect(screen.queryByText('6')).not.toBeInTheDocument()
})
