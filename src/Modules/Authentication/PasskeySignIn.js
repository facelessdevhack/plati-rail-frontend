import React, { useState } from 'react'
import { Alert, Button, Input, Space } from 'antd'
import { useDispatch } from 'react-redux'
import { authenticatePasskey, registerPasskey, supportsPasskeys, passkeyMessage, saveAuthenticatedSession } from '../../Utils/passkeys'
import { completePasskeyLogin, resetToInitialUser } from '../../redux/slices/user.slice'

export default function PasskeySignIn ({ pendingAuth }) {
  const dispatch = useDispatch()
  const [enrolled, setEnrolled] = useState(pendingAuth.hasPasskeys)
  const [name, setName] = useState('My passkey')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const supported = supportsPasskeys()
  const proceed = async () => {
    setBusy(true)
    setError('')
    try {
      if (!enrolled) {
        await registerPasskey(pendingAuth.preAuthToken, name)
        setEnrolled(true)
      } else {
        const user = await authenticatePasskey(pendingAuth.preAuthToken)
        saveAuthenticatedSession(user)
        dispatch(completePasskeyLogin(user))
      }
    } catch (err) { setError(passkeyMessage(err)) } finally { setBusy(false) }
  }
  return <Space direction='vertical' size='middle' style={{ width: '100%', color: 'white' }}>
    <p>{enrolled ? 'Verify your passkey to open Plati.' : 'Create your first passkey, then verify it to open Plati.'}</p>
    <p style={{ fontSize: 13 }}>Use Face ID, Touch ID, your device PIN, or a security key. Signed in as {pendingAuth.email}.</p>
    {!supported && <Alert type='warning' showIcon message='Passkeys need a supported browser on HTTPS. Open Plati in Safari, Chrome, or Edge on a supported device.' />}
    {error && <Alert type='error' showIcon message={error} />}
    {!enrolled && <Input aria-label='Passkey name' placeholder='Passkey name' value={name} maxLength={80} onChange={e => setName(e.target.value)} />}
    <Button type='primary' block size='large' disabled={!supported} loading={busy} onClick={proceed}>
      {enrolled ? 'Verify passkey' : 'Create passkey'}
    </Button>
    <Button block disabled={busy} onClick={() => dispatch(resetToInitialUser())}>Use another account / start again</Button>
  </Space>
}
