import { client } from '../../../Utils/axiosClient'

const root = '/warranty/registration-intake'
export const errorMessage = error => error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.'
export const getRegistrationCapabilities = () => client.get(`${root}/capabilities`, { silent: true }).then(response => response.data)
export const getRegistrationDealers = () => client.get(`${root}/dealers`, { silent: true }).then(response => response.data.dealers)
export const requestRegistrationOtp = data => client.post(`${root}/otp`, data, { silent: true }).then(response => response.data)
export const verifyRegistrationOtp = data => client.post(`${root}/verify`, data, { silent: true }).then(response => response.data)
export const getRegistrationConfirmation = id => client.get(`${root}/${id}/confirmation`, { silent: true }).then(response => response.data.confirmation)
export const retryRegistrationConfirmation = id => client.post(`${root}/${id}/confirmation`, {}, { silent: true }).then(response => response.data)
export const readHandwrittenCardImages = (images, signal) => {
  const data = new FormData()
  images.forEach(file => data.append('images', file))
  return client.post(`${root}/ocr`, data, { silent: true, signal, timeout: 50000, headers: { 'Content-Type': undefined } }).then(response => response.data)
}
