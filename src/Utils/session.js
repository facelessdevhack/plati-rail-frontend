// Client-side session helpers for the login sequence.
//
// The JWT is the real session; redux-persist only mirrors it. These helpers
// keep the two honest: detect a dead token before the user starts working,
// and route expiry through one graceful path instead of a hard reset.

// Decode a JWT payload without verifying — verification is the server's job;
// we only need `exp` to know whether it's worth sending at all.
const decodeTokenPayload = token => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch (e) {
    return null
  }
}

export const SESSION_EXPIRED_EVENT = 'plati:session-expired'

// Several dashboard requests can fail together when a token expires. Keep the
// transition single-flight so those responses cannot each trigger navigation.
let sessionExpiryInProgress = false

const clearAuthStorage = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('persist:root')
}

const buildExpiredLoginUrl = returnTo => {
  const safe =
    returnTo &&
    returnTo.startsWith('/') &&
    !returnTo.startsWith('//') &&
    !returnTo.startsWith('/login')
      ? `&returnTo=${encodeURIComponent(returnTo)}`
      : ''
  return `/login?expired=1${safe}`
}

// True when there is no usable token — missing, malformed, or past its exp.
export const isTokenExpired = () => {
  const token = localStorage.getItem('token')
  if (!token) return true
  const payload = decodeTokenPayload(token)
  if (!payload || !payload.exp) return true
  return payload.exp * 1000 <= Date.now()
}

const getAuthorizationHeader = headers => {
  if (!headers) return null
  if (typeof headers.get === 'function') {
    return headers.get('Authorization') || headers.get('authorization')
  }
  return headers.Authorization || headers.authorization || null
}

export const isUnauthorizedForCurrentSession = error => {
  if (error?.response?.status !== 401) return false

  // Login and other anonymous requests must not be treated as an expired
  // authenticated session merely because their response is 401.
  const requestAuthorization = getAuthorizationHeader(error?.config?.headers)
  if (!requestAuthorization?.startsWith('Bearer ')) return false

  const currentToken = localStorage.getItem('token')
  if (!currentToken) return true

  // A response from an old request may arrive after the user has logged in
  // again. Never let that stale 401 tear down the new session.
  return requestAuthorization === `Bearer ${currentToken}`
}

// End the session gracefully: clear only auth state (not the whole
// localStorage — drafts and other app state survive) and land on the login
// page with an "expired" notice plus a way back to where the user was.
export const handleSessionExpired = returnTo => {
  if (sessionExpiryInProgress || window.location.pathname === '/login') {
    return false
  }

  sessionExpiryInProgress = true
  clearAuthStorage()

  const loginUrl = buildExpiredLoginUrl(returnTo)
  const event = new CustomEvent(SESSION_EXPIRED_EVENT, {
    cancelable: true,
    detail: { loginUrl }
  })

  // App's SessionExpiryBoundary prevents the event's default and performs a
  // React Router navigation. The fallback keeps this helper safe if it is ever
  // used before the app has mounted.
  const handledInApp = !window.dispatchEvent(event)
  if (!handledInApp) {
    window.location.replace(loginUrl)
  }
  return true
}

// A successful login starts a new session and permits a future expiry event.
export const resetSessionExpiryHandling = () => {
  sessionExpiryInProgress = false
}
