import React, { useEffect, useState } from 'react'
import { Alert, Button, Card, Input, List, Popconfirm, Space, Typography } from 'antd'
import { client } from '../../Utils/axiosClient'
import { registerPasskey, authenticatePasskey, saveAuthenticatedSession, passkeyMessage, supportsPasskeys } from '../../Utils/passkeys'
import { useDispatch } from 'react-redux'
import { completePasskeyLogin } from '../../redux/slices/user.slice'

export default function PasskeySettings () {
  const dispatch = useDispatch()
  const [credentials, setCredentials] = useState([])
  const [name, setName] = useState('Backup passkey')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const refresh = async () => setCredentials((await client.get('/auth/passkeys')).data.credentials)
  useEffect(() => { refresh().catch(err => setError(passkeyMessage(err))) }, [])
  const run = async action => {
    setBusy(true); setError('')
    try { await action(); await refresh() } catch (err) { setError(passkeyMessage(err)) } finally { setBusy(false) }
  }
  const verifyAndRun = action => run(async () => {
    const user = await authenticatePasskey()
    saveAuthenticatedSession(user)
    dispatch(completePasskeyLogin(user))
    await action()
  })
  return <main style={{ maxWidth: 720, margin: '32px auto', padding: 24 }}>
    <Card>
      <Typography.Title level={2}>Your passkeys</Typography.Title>
      <Typography.Paragraph>Add a backup on another device or security key before removing a passkey. Removing a passkey signs out sessions that used it.</Typography.Paragraph>
      {error && <Alert type='error' showIcon message={error} style={{ marginBottom: 16 }} />}
      <List dataSource={credentials} renderItem={item => <List.Item actions={[
        <Popconfirm key='remove' title='Remove this passkey?' description='Sessions using it will be signed out.' onConfirm={() => verifyAndRun(() => client.delete(`/auth/passkeys/${encodeURIComponent(item.id)}`))}>
          <Button danger disabled={busy || credentials.length <= 1 || item.current}>Remove</Button>
        </Popconfirm>
      ]}>
        <List.Item.Meta title={`${item.name}${item.current ? ' · current session' : ''}`} description={`Added ${new Date(item.createdAt).toLocaleDateString()}${item.lastUsedAt ? ` · last used ${new Date(item.lastUsedAt).toLocaleDateString()}` : ''}`} />
      </List.Item>} />
      <Space style={{ marginTop: 20 }} wrap>
        <Input aria-label='Backup passkey name' value={name} maxLength={80} onChange={e => setName(e.target.value)} />
        <Button type='primary' loading={busy} disabled={!supportsPasskeys()} onClick={() => verifyAndRun(() => registerPasskey(null, name))}>Add backup passkey</Button>
      </Space>
    </Card>
  </main>
}
