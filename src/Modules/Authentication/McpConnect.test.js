import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import McpConnect from './McpConnect'

jest.mock('react-redux', () => ({ useSelector: jest.fn() }))
jest.mock('antd', () => ({
  Alert: ({ message }) => <p role='alert'>{message}</p>,
  Button: ({ children, loading, disabled, onClick }) => <button disabled={loading || disabled} onClick={onClick}>{children}</button>,
  Card: ({ children }) => <div>{children}</div>,
  Space: ({ children }) => <div>{children}</div>,
  Spin: () => <span>Loading</span>,
  Typography: { Title: ({ children }) => <h1>{children}</h1>, Paragraph: ({ children }) => <p>{children}</p> }
}))

const originalLocation = window.location
const response = body => ({ ok: true, json: async () => body })
const details = { clientName: 'My MCP app', redirectOrigin: 'https://client.example', role: 'member' }
const showLogin = () => {
  const location = useLocation()
  return <p>Login destination: {location.search}</p>
}
const renderConnection = () => render(
  <MemoryRouter initialEntries={['/mcp/connect?request=signed-request']}>
    <Routes>
      <Route path='/mcp/connect' element={<McpConnect />} />
      <Route path='/login' element={React.createElement(showLogin)} />
    </Routes>
  </MemoryRouter>
)

beforeEach(() => {
  useSelector.mockReturnValue({ loggedIn: true, user: { email: 'user@example.com', token: 'erp-session' } })
  global.fetch = jest.fn().mockResolvedValue(response(details))
  delete window.location
  window.location = { ...originalLocation, assign: jest.fn() }
})
afterEach(() => { window.location = originalLocation; jest.clearAllMocks() })

test('sign-in preserves the MCP connection request', async () => {
  useSelector.mockReturnValue({ loggedIn: false, user: {} })
  renderConnection()
  const login = await screen.findByText(/Login destination/)
  expect(decodeURIComponent(login.textContent)).toContain('/mcp/connect?request=signed-request')
})

test('connect uses the Plati session and returns the user to the requesting client', async () => {
  global.fetch.mockResolvedValueOnce(response(details)).mockResolvedValueOnce(response({ redirectUrl: 'https://client.example/callback?code=oauth-code' }))
  renderConnection()
  await screen.findByText('My MCP app')
  fireEvent.click(screen.getByRole('button', { name: 'Connect' }))
  await waitFor(() => expect(window.location.assign).toHaveBeenCalledWith('https://client.example/callback?code=oauth-code'))
  const options = global.fetch.mock.calls[1][1]
  expect(options.headers.Authorization).toBe('Bearer erp-session')
  expect(JSON.parse(options.body)).toEqual({ request: 'signed-request', approved: true })
})

test('cancel denies the request instead of granting access', async () => {
  global.fetch.mockResolvedValueOnce(response(details)).mockResolvedValueOnce(response({ redirectUrl: 'https://client.example/callback?error=access_denied' }))
  renderConnection()
  await screen.findByText('My MCP app')
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  await waitFor(() => expect(window.location.assign).toHaveBeenCalled())
  expect(JSON.parse(global.fetch.mock.calls[1][1].body).approved).toBe(false)
})

test('failed authorization stays on the connection page with a useful error', async () => {
  global.fetch.mockResolvedValueOnce(response(details)).mockResolvedValueOnce({ ok: false, json: async () => ({ error_description: 'Sign in again.' }) })
  renderConnection()
  await screen.findByText('My MCP app')
  fireEvent.click(screen.getByRole('button', { name: 'Connect' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Sign in again.')
  expect(window.location.assign).not.toHaveBeenCalled()
})
