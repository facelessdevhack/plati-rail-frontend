import React, { useEffect, useState } from 'react'
import { Alert, Button, Card, Space, Spin, Typography } from 'antd'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

const apiOrigin = () => new URL(process.env.REACT_APP_API_URL || 'https://plati-system-backend.vercel.app/v2').origin

export default function McpConnect () {
  const location = useLocation()
  const { loggedIn, user } = useSelector(state => state.userDetails)
  const request = new URLSearchParams(location.search).get('request')
  const [details, setDetails] = useState(null)
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setDetails(null)
    setError('')
    if (!request) { setError('Start the connection from your MCP app.'); return () => controller.abort() }
    fetch(`${apiOrigin()}/mcp/oauth/request?request=${encodeURIComponent(request)}`, { signal: controller.signal })
      .then(async response => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error_description || 'Unable to load the connection request.')
        setDetails(body)
      })
      .catch(err => { if (err.name !== 'AbortError') setError(err.message) })
    return () => controller.abort()
  }, [request])

  if (!loggedIn) return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />

  const complete = async approved => {
    setConnecting(true)
    setError('')
    try {
      const response = await fetch(`${apiOrigin()}/mcp/oauth/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ request, approved })
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error_description || body.message || 'Unable to connect. Try signing in again.')
      window.location.assign(body.redirectUrl)
    } catch (err) { setError(err.message); setConnecting(false) }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f5f5f5' }}>
      <Card style={{ maxWidth: 480, width: '100%' }}>
        <Typography.Title level={3}>Connect to Plati</Typography.Title>
        {error && <Alert type='error' showIcon message={error} style={{ marginBottom: 16 }} />}
        {!details && !error && <Spin />}
        {details && <>
          <Typography.Paragraph><strong>{details.clientName}</strong> is requesting read access to Plati’s operational data.</Typography.Paragraph>
          <Typography.Paragraph>Prices, revenue, profit, balances, payments and costs stay hidden.</Typography.Paragraph>
          <Typography.Paragraph type='secondary'>Signed in as {user.email}. You’ll return to {details.redirectOrigin}.</Typography.Paragraph>
          <Space>
            <Button type='primary' loading={connecting} disabled={user.forcePasswordChange} onClick={() => complete(true)}>Connect</Button>
            <Button disabled={connecting} onClick={() => complete(false)}>Cancel</Button>
          </Space>
          {user.forcePasswordChange && <Typography.Paragraph>Change your password before connecting.</Typography.Paragraph>}
        </>}
      </Card>
    </main>
  )
}
