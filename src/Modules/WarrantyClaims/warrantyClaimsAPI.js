import { client } from '../../Utils/axiosClient'

const base = '/warranty-claims'
export const listClaims = params => client.get(base, { params }).then(res => res.data)
export const searchRegistrations = search => client.get(`${base}/registrations`, { params: { search }, silent: true }).then(res => res.data.registrations)
export const createClaim = values => client.post(base, values).then(res => res.data)
export const getClaim = id => client.get(`${base}/${id}`).then(res => res.data)
export const actOnClaim = (id, values) => client.post(`${base}/${id}/actions`, values).then(res => res.data)
export const uploadEvidence = (id, file, kind) => {
  const form = new FormData()
  form.append('kind', kind)
  form.append('file', file)
  return client.post(`${base}/${id}/evidence`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data)
}
export const getEvidenceUrl = (id, evidenceId) => client.get(`${base}/${id}/evidence/${evidenceId}`).then(res => res.data.url)
export const errorMessage = error => error.response?.data?.message || error.message || 'The request could not be completed.'
