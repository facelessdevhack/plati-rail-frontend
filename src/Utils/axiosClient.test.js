import { client, setupAxiosInterceptors } from './axiosClient'
import { SESSION_EXPIRED_EVENT, resetSessionExpiryHandling } from './session'

jest.mock('axios', () => jest.requireActual('axios/dist/node/axios.cjs'))

const jwt = ({ id = 1, iat, exp }) => {
  const encode = value => btoa(JSON.stringify(value)).replace(/=/g, '')
    .replace(/\+/g, '-').replace(/\//g, '_')
  return `${encode({ alg: 'none' })}.${encode({ id, iat, exp })}.test-signature`
}
const now = Math.floor(Date.now() / 1000)
const currentToken = jwt({ iat: now, exp: now + 86400 })
const response = (config, headers = {}) => ({ config, headers, status: 200, statusText: 'OK', data: {} })

setupAxiosInterceptors()

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('token', currentToken)
  resetSessionExpiryHandling()
  window.history.replaceState({}, '', '/dealer-warranty')
})
afterEach(() => { delete client.defaults.adapter })

test.each([
  ['expired cached renewal', jwt({ iat: now - 172800, exp: now - 86400 })],
  ['older cached renewal', jwt({ iat: now - 3600, exp: now + 82800 })],
  ['different account renewal', jwt({ id: 2, iat: now + 1, exp: now + 86401 })],
  ['malformed renewal', 'invalid-token']
])('%s cannot replace a fresh login before sending warranty OTP', async (_, renewal) => {
  // A browser can expose the old response's renewal header after a 304.
  client.defaults.adapter = async config => {
    if (config.method === 'get') return response(config, { 'x-renewed-token': renewal })
    if (config.headers.Authorization !== `Bearer ${currentToken}`) {
      throw { config, response: { status: 401, data: { message: 'Authentication error, token expired.' } } }
    }
    return response(config)
  }
  const onExpiry = jest.fn(event => event.preventDefault())
  window.addEventListener(SESSION_EXPIRED_EVENT, onExpiry)
  try {
    await client.get('/warranty/registration-intake/dealers', { silent: true })
    const submission = await client.post('/warranty/registration-intake/otp', {}, { silent: true }).catch(error => error.response)
    expect(submission.status).toBe(200)
    expect(localStorage.getItem('token')).toBe(currentToken)
    expect(onExpiry).not.toHaveBeenCalled()
  } finally { window.removeEventListener(SESSION_EXPIRED_EVENT, onExpiry) }
})

test('a genuine renewal is used by the next warranty request', async () => {
  const renewal = jwt({ iat: now + 1, exp: now + 86401 })
  client.defaults.adapter = async config => response(config, { 'x-renewed-token': renewal })
  await client.get('/warranty/registration-intake/dealers', { silent: true })
  const submitted = await client.post('/warranty/registration-intake/otp', {}, { silent: true })
  expect(submitted.config.headers.Authorization).toBe(`Bearer ${renewal}`)
})

test('a real authentication failure still ends the current session', async () => {
  client.defaults.adapter = async config => {
    throw { config, response: { status: 401, data: { message: 'Authentication error, token expired.' } } }
  }
  const onExpiry = jest.fn(event => event.preventDefault())
  window.addEventListener(SESSION_EXPIRED_EVENT, onExpiry)
  try {
    await expect(client.post('/warranty/registration-intake/otp', {}, { silent: true })).rejects.toMatchObject({ response: { status: 401 } })
    expect(localStorage.getItem('token')).toBeNull()
    expect(onExpiry).toHaveBeenCalledTimes(1)
  } finally { window.removeEventListener(SESSION_EXPIRED_EVENT, onExpiry) }
})

test('a delayed response cannot overwrite a subsequent login or restore a logged-out session', async () => {
  const renewedOldSession = jwt({ iat: now + 1, exp: now + 86401 })
  const nextLogin = jwt({ id: 2, iat: now + 2, exp: now + 86402 })
  for (const nextToken of [nextLogin, null]) {
    localStorage.setItem('token', currentToken)
    client.defaults.adapter = async config => {
      if (nextToken) localStorage.setItem('token', nextToken)
      else localStorage.removeItem('token')
      return response(config, { 'x-renewed-token': renewedOldSession })
    }
    await client.get('/warranty/registration-intake/capabilities', { silent: true })
    expect(localStorage.getItem('token')).toBe(nextToken)
  }
})
