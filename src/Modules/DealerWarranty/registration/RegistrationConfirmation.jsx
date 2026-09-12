import React, { useEffect, useState } from 'react'
import { Alert, Button } from 'antd'
import { errorMessage, getRegistrationCapabilities, getRegistrationConfirmation, retryRegistrationConfirmation } from './registrationAPI'

export default function RegistrationConfirmation({ registrationId }) {
  const [confirmation, setConfirmation] = useState(null)
  const [canRetry, setCanRetry] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getRegistrationCapabilities().then(async capabilities => {
      if (!capabilities.canRegister) return
      const result = await getRegistrationConfirmation(registrationId)
      if (active) { setCanRetry(true); setConfirmation(result) }
    }).catch(() => {})
    return () => { active = false }
  }, [registrationId])
  if (!confirmation) return null
  const retry = async () => {
    setBusy(true); setError('')
    try { const result = await retryRegistrationConfirmation(registrationId); setConfirmation(result.confirmation) }
    catch (err) { setError(errorMessage(err)) }
    finally { setBusy(false) }
  }
  return <Alert className="mb-4" showIcon type={confirmation.status === 'accepted' ? 'success' : 'warning'}
    message={confirmation.status === 'accepted' ? 'Registration success message accepted by the messaging provider.' : 'The warranty is registered. Customer confirmation is pending or could not be sent.'}
    description={error || undefined} action={canRetry && confirmation.status !== 'accepted' && <Button loading={busy} onClick={retry}>Retry confirmation</Button>} />
}
