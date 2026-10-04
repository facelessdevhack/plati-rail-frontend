import { client, warrantyClient, setupAxiosInterceptors } from './axiosClient'

jest.mock('axios', () => ({
  create: jest.fn(() => ({ defaults: {}, interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } }))
}))
jest.mock('./globalLoading', () => ({ startRequest: jest.fn(), endRequest: jest.fn() }))
const token = (id, sid, version = 1) => `header.${btoa(JSON.stringify({ id, sid, version, kind: 'erp-session', amr: ['webauthn'], exp: 9999999999, sessionExpiresAt: 9999999999 }))}.signature`
const response = (requestToken, renewed, url = '/entries/get-payment-entries') => ({
  config: { url, headers: { Authorization: `Bearer ${requestToken}` } },
  headers: renewed ? { 'x-renewed-token': renewed } : {},
  data: { entries: [{ amount: 40000 }] }
})
let receive, receiveWarranty
beforeAll(() => {
  setupAxiosInterceptors()
  receive = client.interceptors.response.use.mock.calls[0][0]
  receiveWarranty = warrantyClient.interceptors.response.use.mock.calls[0][0]
})
beforeEach(() => localStorage.clear())

test('a late payment response from an old sign-in cannot repopulate data or replace the new token', () => {
  const current = token(8, 'new-session')
  localStorage.setItem('token', current)
  expect(() => receive(response(token(7, 'old-session'), token(7, 'old-session', 2)))).toThrow('previous sign-in')
  expect(localStorage.getItem('token')).toBe(current)
})

test('a late logout response cannot restore a token after local sign-out', () => {
  const result = response(token(7, 'session'), token(7, 'session', 2), '/auth/passkeys/logout')
  expect(receive(result)).toBe(result)
  expect(localStorage.getItem('token')).toBeNull()
})

test('hourly renewal preserves a current passkey session', () => {
  const old = token(7, 'session'), renewed = token(7, 'session', 2)
  localStorage.setItem('token', old)
  const result = response(old, renewed)
  expect(receive(result)).toBe(result)
  expect(localStorage.getItem('token')).toBe(renewed)
})

test('late warranty responses are discarded after sign-out too', () => {
  expect(() => receiveWarranty(response(token(7, 'session')))).toThrow('previous sign-in')
})
