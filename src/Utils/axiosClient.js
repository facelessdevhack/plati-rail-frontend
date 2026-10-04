import axios from 'axios'
import { startRequest, endRequest } from './globalLoading'
import {
  handleSessionExpired,
  isUnauthorizedForCurrentSession,
  isSameAppSession,
  isAppSessionToken
} from './session'

const commonHeader = {
  'Content-Type': 'application/json',
  Accept: '*/*'
}

const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL
})

const getError = error => {
  const response = error?.response
  // Network failures / timeouts have no response — destructuring it threw a
  // TypeError inside every thunk's catch, replacing the real error message.
  if (!response) {
    return {
      code: 0,
      statusText: 'Network Error',
      message: error?.message || 'Network error — server unreachable'
    }
  }
  // response.data may be a string (HTML error page) or null
  const data =
    response.data && typeof response.data === 'object' ? response.data : {}
  if (!data.code) {
    data.code = response.status
  }
  data.statusText = response.statusText
  if (!data.message && typeof response.data === 'string' && response.data) {
    data.message = response.statusText || 'Request failed'
  }
  return { ...data }
}

client.defaults.withCredentials = false

let interceptorsInstalled = false

const responseSessionIsCurrent = res => {
  const authorization = res.config?.headers?.Authorization || res.config?.headers?.get?.('Authorization')
  const requestToken = authorization?.replace(/^Bearer /, '')
  return !isAppSessionToken(requestToken) || isSameAppSession(requestToken, localStorage.getItem('token'))
}

const rejectStaleData = res => {
  if (!responseSessionIsCurrent(res) && !['/auth/login', '/auth/passkeys/logout'].includes(res.config?.url)) {
    throw Object.assign(new Error('This response belongs to a previous sign-in.'), { code: 'STALE_SESSION_RESPONSE' })
  }
}

const setupAxiosInterceptors = () => {
  if (interceptorsInstalled) return
  interceptorsInstalled = true
  // we can get the access of store here by which we can dispatch action's like clearing the user state

  client.interceptors.request.use(
    async config => {
      if (!config.silent) startRequest()
      const token = config.authToken || localStorage.getItem('token')
      // Merge Authorization header with existing headers
      config.headers = {
        ...commonHeader,
        ...(config.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
      return config
    },
    error => {
      // Request never left — end immediately if we had counted it.
      if (!error?.config?.silent) endRequest()
      if (error.response) {
        error = getError(error)
      }
      return Promise.reject(error)
    }
  )

  client.interceptors.response.use(
    res => {
      if (!res?.config?.silent) endRequest()
      rejectStaleData(res)
      // Renewed role claims retain the session's absolute passkey expiry.
      const renewed = res?.headers?.['x-renewed-token']
      if (renewed && responseSessionIsCurrent(res)) {
        localStorage.setItem('token', renewed)
      }
      return res
    },
    async error => {
      if (!error?.config?.silent) endRequest()
      // error.response is undefined for network errors — guard before reading status
      if (isUnauthorizedForCurrentSession(error)) {
        handleSessionExpired(
          window.location.pathname + window.location.search
        )
      }

      return Promise.reject(error)
    }
  )
}

const warrantyClient = axios.create({
  baseURL: process.env.REACT_APP_WARRANTY_API_URL || process.env.REACT_APP_API_URL
})

warrantyClient.defaults.withCredentials = false

warrantyClient.interceptors.request.use(
  config => {
    if (!config.silent) startRequest()
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    if (!error?.config?.silent) endRequest()
    return Promise.reject(error)
  }
)

warrantyClient.interceptors.response.use(
  res => {
    if (!res?.config?.silent) endRequest()
    rejectStaleData(res)
    return res
  },
  error => {
    if (!error?.config?.silent) endRequest()
    if (isUnauthorizedForCurrentSession(error)) {
      handleSessionExpired(
        window.location.pathname + window.location.search
      )
    }
    return Promise.reject(error)
  }
)

export { client, setupAxiosInterceptors, getError, warrantyClient }
