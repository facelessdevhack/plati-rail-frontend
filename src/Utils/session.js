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

// True when there is no usable token — missing, malformed, or past its exp.
export const isTokenExpired = () => {
  const token = localStorage.getItem('token')
  if (!token) return true
  const payload = decodeTokenPayload(token)
  if (!payload || !payload.exp) return true
  return payload.exp * 1000 <= Date.now()
}

// End the session gracefully: clear only auth state (not the whole
// localStorage — drafts and other app state survive) and land on the login
// page with an "expired" notice plus a way back to where the user was.
export const handleSessionExpired = returnTo => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('persist:root')
  if (window.location.pathname === '/login') return
  const safe =
    returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
      ? `&returnTo=${encodeURIComponent(returnTo)}`
      : ''
  window.location.href = `/login?expired=1${safe}`
}
