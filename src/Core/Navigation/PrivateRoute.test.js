import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import PrivateRoute from './PrivateRoute'

jest.mock('react-redux', () => ({ useSelector: jest.fn() }))
jest.mock('../../Utils/session', () => ({ isTokenExpired: () => false, handleSessionExpired: jest.fn() }))

test.each([
  [{ roleId: 5, permissions: ['dashboard.view', 'dashboard.analytics'] }, 'Access denied'],
  [{ roleId: 5, permissions: ['sales.overview.view'] }, 'Sales Overview'],
  [{ roleId: 999, permissions: [] }, 'Sales Overview']
])('Sales Overview direct links enforce the named permission for %j', (user, expected) => {
  useSelector.mockReturnValue({ loggedIn: true, user })
  render(
    <MemoryRouter initialEntries={['/admin-dashboard']}>
      <Routes>
        <Route path='/admin-dashboard' element={
          <PrivateRoute allowedPermissions={['sales.overview.view']}><div>Sales Overview</div></PrivateRoute>
        } />
        <Route path='/unauthorized' element={<div>Access denied</div>} />
      </Routes>
    </MemoryRouter>
  )
  expect(screen.getByText(expected)).toBeTruthy()
})
