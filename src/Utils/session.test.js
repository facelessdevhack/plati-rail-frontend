import {
  SESSION_EXPIRED_EVENT,
  handleSessionExpired,
  isUnauthorizedForCurrentSession,
  isTokenExpired,
  resetSessionExpiryHandling
} from './session'
import { isSameAppSession, sessionMatchesUser } from './session'

const jwtWithExpiry = expiry => {
  const encode = value => btoa(JSON.stringify(value))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  return `${encode({ alg: 'none' })}.${encode({ exp: expiry, kind: 'erp-session', amr: ['webauthn'], sessionExpiresAt: expiry })}.signature`
}

beforeEach(() => {
  localStorage.clear()
  resetSessionExpiryHandling()
  window.history.replaceState({}, '', '/sales-dashboard')
})

test('expired tokens are detected before protected routes render', () => {
  localStorage.setItem('token', jwtWithExpiry(Math.floor(Date.now() / 1000) - 5))
  expect(isTokenExpired()).toBe(true)

  localStorage.setItem('token', jwtWithExpiry(Math.floor(Date.now() / 1000) + 60))
  expect(isTokenExpired()).toBe(false)
})

test('legacy and password-only sessions never open the app', () => {
  const encode = value => btoa(JSON.stringify(value))
  for (const kind of ['passkey-preauth', undefined]) {
    localStorage.setItem('token', `header.${encode({ kind, exp: Math.floor(Date.now() / 1000) + 3600 })}.signature`)
    expect(isTokenExpired()).toBe(true)
  }
})

test('a revoked passkey response expires only the current session', () => {
  const token = jwtWithExpiry(Math.floor(Date.now() / 1000) + 3600)
  localStorage.setItem('token', token)
  const response = { status: 403, data: { code: 'PASSKEY_REQUIRED' } }
  expect(isUnauthorizedForCurrentSession({ response, config: { headers: { Authorization: `Bearer ${token}` } } })).toBe(true)
  expect(isUnauthorizedForCurrentSession({ response, config: { headers: { Authorization: 'Bearer old-token' } } })).toBe(false)
})

test('renewed tokens keep the same account/session; another account or sign-in clears old app state', () => {
  const token = (id, sid, iat) => `header.${btoa(JSON.stringify({ id, sid, iat, kind: 'erp-session' }))}.signature`
  const original = token(7, 'first', 1)
  localStorage.setItem('token', token(7, 'first', 2))
  expect(sessionMatchesUser({ token: original })).toBe(true)
  expect(isSameAppSession(original, token(8, 'first', 2))).toBe(false)
  localStorage.setItem('token', token(7, 'second', 2))
  expect(sessionMatchesUser({ token: original })).toBe(false)
})

test('concurrent expiry responses produce one in-app navigation event', () => {
  localStorage.setItem('token', 'expired-token')
  localStorage.setItem('user', '{}')
  localStorage.setItem('persist:root', '{}')
  const events = []
  const listener = event => {
    event.preventDefault()
    events.push(event.detail)
  }
  window.addEventListener(SESSION_EXPIRED_EVENT, listener)

  expect(handleSessionExpired('/sales-dashboard?tab=trends')).toBe(true)
  expect(handleSessionExpired('/sales-dashboard?tab=trends')).toBe(false)

  window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
  expect(events).toEqual([{
    loginUrl: '/login?expired=1&returnTo=%2Fsales-dashboard%3Ftab%3Dtrends'
  }])
  expect(localStorage.getItem('token')).toBeNull()
  expect(localStorage.getItem('persist:root')).toBeNull()
})

test('only a 401 for the token that is still current expires the session', () => {
  localStorage.setItem('token', 'new-token')

  expect(isUnauthorizedForCurrentSession({
    response: { status: 401 },
    config: { headers: { Authorization: 'Bearer old-token' } }
  })).toBe(false)

  expect(isUnauthorizedForCurrentSession({
    response: { status: 401 },
    config: { headers: { Authorization: 'Bearer new-token' } }
  })).toBe(true)

  expect(isUnauthorizedForCurrentSession({
    response: { status: 401 },
    config: { headers: {} }
  })).toBe(false)
})

test('a business-endpoint 401 cannot log out a healthy current session', () => {
  const token = jwtWithExpiry(Math.floor(Date.now() / 1000) + 3600)
  localStorage.setItem('token', token)

  expect(isUnauthorizedForCurrentSession({
    response: {
      status: 401,
      data: { message: 'Sales Coordination data is unavailable.' }
    },
    config: { headers: { Authorization: `Bearer ${token}` } }
  })).toBe(false)
})

test('an explicit authentication 401 still expires a healthy-looking token', () => {
  const token = jwtWithExpiry(Math.floor(Date.now() / 1000) + 3600)
  localStorage.setItem('token', token)

  expect(isUnauthorizedForCurrentSession({
    response: {
      status: 401,
      data: { message: 'Authentication error, token expired.' }
    },
    config: { headers: { Authorization: `Bearer ${token}` } }
  })).toBe(true)
})
