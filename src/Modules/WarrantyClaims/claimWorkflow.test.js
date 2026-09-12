import { availableActions } from './claimWorkflow'
import { getSectionsForRole } from '../Layout/Routes/topNavRoutes'

test.each(['view', 'create', 'review', 'fulfill'])('a custom role with the %s grant can discover the claims module', action => {
  const sections = getSectionsForRole(50, [`warranty_claims.${action}`])
  expect(sections.find(section => section.key === 'warranty-claims')?.defaultPath).toBe('/warranty-claims')
  expect(getSectionsForRole(50, []).some(section => section.key === 'warranty-claims')).toBe(false)
})

test('read-only access offers no mutations and submission access cannot approve', () => {
  const claim = { status: 'under_review', createdBy: 1 }
  expect(availableActions(claim, { view: true }, 1)).toEqual([])
  expect(availableActions(claim, { create: true }, 1).map(action => action.key)).toEqual(['note'])
  expect(availableActions(claim, { review: true }, 2).map(action => action.key)).toEqual(['request_info', 'approve', 'reject', 'note'])
})

test('workshop actions follow the approved resolution and closed claims only accept notes', () => {
  const keys = claim => availableActions(claim, { fulfill: true }, 3).map(action => action.key)
  expect(keys({ status: 'received', resolution: 'repair' })).toEqual(['start_repair', 'note'])
  expect(keys({ status: 'received', resolution: 'replacement' })).toEqual(['complete_resolution', 'note'])
  expect(keys({ status: 'closed', resolution: 'replacement' })).toEqual(['note'])
})
