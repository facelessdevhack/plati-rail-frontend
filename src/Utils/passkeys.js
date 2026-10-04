import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { client } from './axiosClient'
import { resetSessionExpiryHandling } from './session'

export const supportsPasskeys = () => window.isSecureContext && browserSupportsWebAuthn()
const settings = token => token ? { authToken: token } : {}

export async function registerPasskey (token, name) {
  const { data } = await client.post('/auth/passkeys/registration/options', {}, settings(token))
  const response = await startRegistration({ optionsJSON: data.options })
  return (await client.post('/auth/passkeys/registration/verify', { response, challengeId: data.challengeId, name }, settings(token))).data
}

export async function authenticatePasskey (token) {
  const { data } = await client.post('/auth/passkeys/authentication/options', {}, settings(token))
  const response = await startAuthentication({ optionsJSON: data.options })
  return (await client.post('/auth/passkeys/authentication/verify', { response, challengeId: data.challengeId }, settings(token))).data
}

export function saveAuthenticatedSession (user) {
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('token', user.token)
  resetSessionExpiryHandling()
}

export const passkeyMessage = error => {
  if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') return 'Passkey verification was cancelled or timed out. Please try again.'
  return error?.response?.data?.message || error?.message || 'Unable to verify your passkey.'
}

export async function signOut () {
  const token = localStorage.getItem('token')
  const revocation = token ? client.post('/auth/passkeys/logout', {}, { silent: true, authToken: token, timeout: 5000 }) : Promise.resolve()
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('persist:root')
  window.dispatchEvent(new Event('storage'))
  try { await revocation } catch { /* Local sign-out still works if the server is unavailable. */ }
}
