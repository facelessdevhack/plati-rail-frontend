import { client } from '../../Utils/axiosClient'
import { editEntryAPI } from './entriesAPI'

jest.mock('../../Utils/axiosClient', () => ({
  client: { put: jest.fn() },
  getError: jest.fn()
}))

beforeEach(() => jest.clearAllMocks())

test('maps a dealer charge row to charge fields without sales-only columns', async () => {
  const response = { status: 200 }
  client.put.mockResolvedValueOnce(response)
  await expect(editEntryAPI({
    id: 123,
    dealerId: 48,
    sourceType: 4,
    price: '8400',
    productName: 'REPAIR CHARGES FOR VOSSEN 18" 4 PCS HS',
    productId: 0,
    quantity: 0,
    transportationCharges: 0,
    isClaim: 0
  })).resolves.toBe(response)
  expect(client.put).toHaveBeenCalledWith('entries/edit-entry', {
    id: 123,
    dealerId: 48,
    sourceType: 4,
    amount: '8400',
    description: 'REPAIR CHARGES FOR VOSSEN 18" 4 PCS HS'
  })
})

test('preserves explicit charge fields, including a zero amount', async () => {
  await editEntryAPI({ id: 123, sourceType: '4', amount: 0, price: 16000,
    description: '', productName: 'Old description' })
  expect(client.put).toHaveBeenCalledWith('entries/edit-entry', {
    id: 123, sourceType: 4, amount: 0, description: ''
  })
})

test.each([1, 4])('rejects failed type %s edits instead of returning a truthy error', async sourceType => {
  const error = new Error('Update failed')
  client.put.mockRejectedValueOnce(error)
  await expect(editEntryAPI({ id: 123, sourceType, price: 8400 })).rejects.toBe(error)
})

test('preserves sales fields for sales edits', async () => {
  await editEntryAPI({ id: 123, sourceType: 1, productId: 42, quantity: 4,
    price: 8400, isClaim: 0, transportationCharges: 100 })
  expect(client.put).toHaveBeenCalledWith('entries/edit-entry', expect.objectContaining({
    id: 123, sourceType: 1, productId: 42, quantity: 4,
    price: 8400, isClaim: 0, transportationCharges: 100
  }))
})
