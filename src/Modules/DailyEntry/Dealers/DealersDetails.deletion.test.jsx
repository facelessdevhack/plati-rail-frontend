import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Modal, message } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import AdminDealerDetails from './DealersDetails'
import { deletePaymentEntryAPI, getPaymentDeletionPreviewAPI } from '../../../redux/api/entriesAPI'

jest.mock('react-redux', () => ({ useDispatch: jest.fn(), useSelector: jest.fn() }))
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: '230' }),
  useLocation: () => ({ pathname: '/admin-dealers/230', search: '?paymentId=14167', state: { name: 'Umer Enterprises' } })
}))
jest.mock('../../../Utils/axiosClient', () => ({ client: { get: jest.fn(async () => ({ data: [{ currentBal: 57350 }] })) } }))
jest.mock('../../../redux/api/entriesAPI', () => ({
  getAllEntriesAdmin: jest.fn(), getMiddleDealers: jest.fn(), getAllDealersOrders: jest.fn(),
  getAdminPaymentMethods: jest.fn(), getAllPaymentMethods: jest.fn(), getPaymentEntries: jest.fn(),
  getPaymentDeletionPreviewAPI: jest.fn(), deletePaymentEntryAPI: jest.fn()
}))
jest.mock('../../../redux/api/stockAPI', () => ({ getAllProducts: jest.fn() }))

const preview = {
  dealerName: 'Umer Enterprises', amount: 40000, paymentDate: '2026-09-11', description: 'CASH',
  previewToken: 'a'.repeat(64), requiresRelease: true, restoredAllocationCount: 2, restoredAmount: 40000,
  adjustments: [{ id: 3722, dealerName: 'Paymine', amount: 39760 }],
  dependentPayments: [{ paymentId: 14266, dealerName: 'Paymine', releasedAmount: 39760, reallocatedAmount: 39760, unallocatedAfter: 0,
    reallocations: [{ targetId: 3732, label: 'Another dealer', allocatedAmount: 39760 }] }]
}

let confirmations
beforeEach(() => {
  confirmations = []
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })
  useDispatch.mockReturnValue(jest.fn())
  useSelector.mockImplementation(selector => selector({
    userDetails: { user: { roleId: 5 } }, stockDetails: { allProducts: [] },
    entryDetails: { allDealerEntries: [], allPMEntries: [{ id: 14167, amount: 40000, paymentDate: '2026-09-11', description: 'CASH', isPaid: 1, currentBal: 57350 }],
      allMiddleDealers: [], adminPaymentMethods: [], allAdminPaymentMethods: [], allDealersOrders: [], pmEntryCount: 1 }
  }))
  jest.spyOn(Modal, 'confirm').mockImplementation(config => {
    const modal = { ...config, destroy: jest.fn() }
    confirmations.push(modal)
    return modal
  })
  jest.spyOn(message, 'error').mockImplementation(() => {})
  jest.spyOn(message, 'success').mockImplementation(() => {})
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  getPaymentDeletionPreviewAPI.mockResolvedValue(preview)
  deletePaymentEntryAPI.mockResolvedValue({ data: { message: 'Payment reversed successfully.' } })
})
afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks() })

async function openDeletion() {
  render(<AdminDealerDetails />)
  fireEvent.click(await screen.findByTitle('Delete payment'))
  await waitFor(() => expect(confirmations).toHaveLength(1))
  expect(deletePaymentEntryAPI).not.toHaveBeenCalled()
  return render(confirmations[0].content)
}

test('previews the selected settlement, requires a reason, and deletes only after confirmation', async () => {
  await openDeletion()
  expect(getPaymentDeletionPreviewAPI).toHaveBeenCalledWith(14167)
  expect(screen.getByText(/Paymine payment #14266/)).toBeTruthy()
  expect(screen.getByText(/will be reapplied to unpaid adjustments, oldest first/)).toBeTruthy()
  expect(screen.getByText(/Adjustment #3732 · Another dealer/)).toBeTruthy()
  expect(screen.getByText(/Remaining unallocated credit: ₹0/)).toBeTruthy()
  await act(async () => { await expect(confirmations[0].onOk()).rejects.toThrow('Deletion reason is required') })
  expect(deletePaymentEntryAPI).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Reason for deletion'), { target: { value: 'Incorrect payment entry' } })
  await act(async () => { await confirmations[0].onOk() })
  expect(deletePaymentEntryAPI).toHaveBeenCalledWith({
    paymentId: 14167, reason: 'Incorrect payment entry', releaseDependentAllocations: true, deletionPreviewToken: preview.previewToken
  })
})

test('a changed settlement opens a fresh confirmation without repeating deletion', async () => {
  await openDeletion()
  fireEvent.change(screen.getByLabelText('Reason for deletion'), { target: { value: 'Incorrect payment entry' } })
  getPaymentDeletionPreviewAPI.mockResolvedValue({ ...preview, previewToken: 'b'.repeat(64) })
  deletePaymentEntryAPI.mockRejectedValueOnce({ response: { status: 409, data: { code: 'PAYMENT_DELETION_CHANGED', message: 'Review a fresh deletion preview.' } } })
  await act(async () => { await confirmations[0].onOk() })
  expect(confirmations[0].destroy).toHaveBeenCalled()
  expect(confirmations).toHaveLength(2)
  expect(deletePaymentEntryAPI).toHaveBeenCalledTimes(1)
  expect(getPaymentDeletionPreviewAPI).toHaveBeenCalledTimes(2)
})
