import moment from 'moment'

export const claimPermissions = ['view', 'create', 'review', 'fulfill'].map(action => `warranty_claims.${action}`)
export const statusLabels = {
  submitted: 'Submitted', needs_info: 'Needs information', under_review: 'Under review', approved: 'Approved',
  received: 'At workshop', in_repair: 'In repair', ready_to_return: 'Ready to return', returned: 'Returned to dealer',
  closed: 'Closed', rejected: 'Rejected', cancelled: 'Cancelled'
}
export const statusColors = { submitted: 'blue', needs_info: 'orange', under_review: 'purple', approved: 'green',
  received: 'cyan', in_repair: 'gold', ready_to_return: 'geekblue', returned: 'blue', closed: 'green', rejected: 'red' }
export const formatTime = value => value ? moment.utc(value).utcOffset(330).format('DD MMM YYYY, hh:mm A') : '—'
export const formatDate = value => value ? moment.utc(value).format('DD MMM YYYY') : '—'
export const isOverdue = claim => ['submitted', 'needs_info', 'under_review'].includes(claim.status) && moment(claim.decisionDueAt).isBefore(moment())
export const evidenceLabels = { damage_photo: 'Damaged product photo', vehicle_photo: 'Vehicle photo', invoice: 'Invoice', other: 'Other evidence' }

export function availableActions(claim, capabilities, userId) {
  const actions = []
  const add = (key, label, permission, states) => {
    if (capabilities[permission] && states.includes(claim.status)) actions.push({ key, label })
  }
  add('start_review', 'Start review', 'review', ['submitted', 'needs_info'])
  add('request_info', 'Request information', 'review', ['submitted', 'under_review'])
  add('resubmit', 'Resubmit for review', 'create', ['needs_info'])
  add('approve', 'Approve claim', 'review', ['under_review'])
  add('reject', 'Reject claim', 'review', ['under_review'])
  if (Number(claim.createdBy) === Number(userId) || capabilities.review) add('cancel', 'Cancel claim', 'create', ['submitted', 'needs_info'])
  add('receive', 'Receive at workshop', 'fulfill', ['approved'])
  if (claim.resolution === 'repair') add('start_repair', 'Start repair', 'fulfill', ['received'])
  add('complete_resolution', claim.resolution === 'repair' ? 'Complete repair' : 'Record replacement', 'fulfill',
    claim.resolution === 'repair' ? ['in_repair'] : ['received'])
  add('return_to_dealer', 'Return to dealer', 'fulfill', ['ready_to_return'])
  add('close', 'Confirm receipt and close', 'fulfill', ['returned'])
  if (capabilities.create || capabilities.review || capabilities.fulfill) actions.push({ key: 'note', label: 'Add note' })
  return actions
}
