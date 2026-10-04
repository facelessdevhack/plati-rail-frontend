import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { resetToInitialUser } from '../../redux/slices/user.slice'
import { isTokenExpired, getSessionExpiryTime, sessionMatchesUser } from '../../Utils/session'

// Block rendering persisted app data until a usable passkey session exists.
export default function PasskeySessionBoundary ({ children }) {
  const { loggedIn, user } = useSelector(state => state.userDetails)
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const [, checkSession] = useState(0)
  const stale = loggedIn && (isTokenExpired() || !sessionMatchesUser(user))
  useEffect(() => {
    if (!loggedIn) return undefined
    const refresh = () => checkSession(value => value + 1)
    const timer = setTimeout(refresh, Math.max(0, getSessionExpiryTime() - Date.now() + 20))
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => { clearTimeout(timer); window.removeEventListener('focus', refresh); window.removeEventListener('storage', refresh) }
  }, [loggedIn, user?.token])
  useEffect(() => {
    if (!stale) return
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('persist:root')
    dispatch(resetToInitialUser())
    const returnTo = location.pathname + location.search
    navigate(`/login?expired=1${location.pathname === '/login' ? '' : `&returnTo=${encodeURIComponent(returnTo)}`}`, { replace: true })
  }, [stale, dispatch, navigate, location.pathname, location.search])
  return stale ? null : children
}
