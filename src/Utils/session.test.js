import {
  SESSION_EXPIRED_EVENT,
  handleSessionExpired,
  isUnauthorizedForCurrentSession,
  isTokenExpired,
  resetSessionExpiryHandling
} from './session'

const jwtWithExpiry = expiry => {
  const encode = value => btoa(JSON.stringify(value))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  return `${encode({ alg: 'none' })}.${encode({ exp: expiry })}.signature`
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
