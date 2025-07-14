import axios from 'axios'

const commonHeader = {
  'Content-Type': 'application/json',
  'Content-Disposition': '',
  Accept: '*/*',
  'Access-Control-Allow-Origin': window.location.origin,
  'Access-Control-Allow-Credentials': true
}

const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL
})

const getError = ({ response }) => {
  const { data } = response
  if (!data.code) {
    data.code = response.status
  }
  data.statusText = response.statusText
  return { ...data }
}

const handleLogOutUser = () => {
  localStorage.clear()
  if (window.location.pathname !== '/') {
    window.location.href = '/'
  }
}

client.defaults.withCredentials = false

const setupAxiosInterceptors = () => {
  // we can get the access of store here by which we can dispatch action's like clearing the user state

  client.interceptors.request.use(
    async config => {
      const token = localStorage.getItem('token')
      // Merge Authorization header with existing headers
      config.headers = {
        ...commonHeader,
        ...(config.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
      return config
    },
    error => {
      if (error.response) {
        error = getError(error)
      }
      return Promise.reject(error)
    }
  )

  client.interceptors.response.use(
    res => {
      return res
    },
    async error => {
      console.log('helllooooo', error)
      const { status } = error.response

      if (status === 401) {
        handleLogOutUser()
      }

      return Promise.reject(error)
    }
  )
}

const warrantyClient = axios.create({
  baseURL: process.env.REACT_APP_WARRANTY_API_URL || 'http://localhost:4001/v2'
})

warrantyClient.defaults.withCredentials = false

warrantyClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

warrantyClient.interceptors.response.use(
  res => {
    return res
  },
  error => {
    return Promise.reject(error)
  }
)

export { client, setupAxiosInterceptors, getError, warrantyClient }
