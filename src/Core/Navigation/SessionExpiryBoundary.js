import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { resetToInitialUser } from '../../redux/slices/user.slice'
import { SESSION_EXPIRED_EVENT } from '../../Utils/session'

const SessionExpiryBoundary = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    const onSessionExpired = event => {
      // Tell the session helper that React Router owns this transition, so its
      // hard-navigation fallback is not used.
      event.preventDefault()
      dispatch(resetToInitialUser())
      navigate(event.detail?.loginUrl || '/login?expired=1', { replace: true })
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
  }, [dispatch, navigate])

  return null
}

export default SessionExpiryBoundary
