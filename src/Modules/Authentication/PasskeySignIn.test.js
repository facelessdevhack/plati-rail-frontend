import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useDispatch } from 'react-redux'
import PasskeySignIn from './PasskeySignIn'
import { authenticatePasskey, registerPasskey, supportsPasskeys, saveAuthenticatedSession } from '../../Utils/passkeys'

jest.mock('react-redux', () => ({ useDispatch: jest.fn() }))
jest.mock('../../Utils/axiosClient', () => ({ client: { post: jest.fn() }, getError: err => err.message }))
jest.mock('../../Utils/passkeys', () => ({
  authenticatePasskey: jest.fn(), registerPasskey: jest.fn(), supportsPasskeys: jest.fn(),
  saveAuthenticatedSession: jest.fn(), passkeyMessage: err => err.message
}))
jest.mock('antd', () => ({
  Alert: ({ message }) => <p role='alert'>{message}</p>,
  Button: ({ children, loading, disabled, onClick }) => <button disabled={loading || disabled} onClick={onClick}>{children}</button>,
  Input: props => <input {...props} />,
  Space: ({ children }) => <div>{children}</div>
}))
const dispatch = jest.fn()
beforeEach(() => {
  jest.clearAllMocks()
  useDispatch.mockReturnValue(dispatch)
  supportsPasskeys.mockReturnValue(true)
  registerPasskey.mockResolvedValue({ registered: true })
  authenticatePasskey.mockResolvedValue({ token: 'verified-session', passkeyAuthenticated: true })
})

test('first enrollment does not mark the user logged in until a separate passkey assertion succeeds', async () => {
  render(<PasskeySignIn pendingAuth={{ email: 'user@example.com', preAuthToken: 'setup-ticket', hasPasskeys: false }} />)
  fireEvent.click(screen.getByRole('button', { name: 'Create passkey' }))
  await screen.findByRole('button', { name: 'Verify passkey' })
  expect(registerPasskey).toHaveBeenCalledWith('setup-ticket', 'My passkey')
  expect(authenticatePasskey).not.toHaveBeenCalled()
  expect(saveAuthenticatedSession).not.toHaveBeenCalled()
  expect(dispatch).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Verify passkey' }))
  await waitFor(() => expect(saveAuthenticatedSession).toHaveBeenCalledWith({ token: 'verified-session', passkeyAuthenticated: true }))
  expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'userDetails/completePasskeyLogin' }))
})

test('existing users must verify a passkey and cannot re-enroll through the password screen', async () => {
  render(<PasskeySignIn pendingAuth={{ preAuthToken: 'setup-ticket', hasPasskeys: true }} />)
  expect(screen.queryByRole('button', { name: 'Create passkey' })).toBeNull()
  authenticatePasskey.mockRejectedValueOnce(new Error('Verification cancelled'))
  fireEvent.click(screen.getByRole('button', { name: 'Verify passkey' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Verification cancelled')
  expect(dispatch).not.toHaveBeenCalled()
  expect(saveAuthenticatedSession).not.toHaveBeenCalled()
  expect(registerPasskey).not.toHaveBeenCalled()
})

test('unsupported devices cannot skip passkey verification', () => {
  supportsPasskeys.mockReturnValue(false)
  render(<PasskeySignIn pendingAuth={{ preAuthToken: 'setup-ticket', hasPasskeys: true }} />)
  expect(screen.getByRole('button', { name: 'Verify passkey' }).disabled).toBe(true)
  expect(screen.getByRole('alert').textContent).toContain('supported browser')
})
