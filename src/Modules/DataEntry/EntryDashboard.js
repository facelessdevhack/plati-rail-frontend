import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileTextOutlined,
  TeamOutlined,
  TagOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  AppstoreAddOutlined,
  CarOutlined,
  BgColorsOutlined,
  UserAddOutlined,
  EditOutlined,
  UnorderedListOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'

import PageTitle from '../../Core/Components/PageTitle'
import KpiCard from '../../Core/Components/KpiCard'
import { getAllDealers } from '../../redux/api/stockAPI'
import { getDailyEntry, getPricingPendingEntriesAPI } from '../../redux/api/entriesAPI'

const FONT = "'Inter', sans-serif"
const INK = '#1a1a1a'
const MUTED = '#a0a0a8'
const BORDER = '#e5e5e5'
const ORANGE = '#f26c2d'

const QUICK_ACTIONS = [
  { label: 'Add Stock', desc: 'Alloy stock against existing models', to: '/add-stock', icon: <InboxOutlined /> },
  { label: 'Add Cap', desc: 'Centre cap stock', to: '/add-cap-stock', icon: <AppstoreAddOutlined /> },
  { label: 'Add Model', desc: 'New alloy wheel model', to: '/add-model', icon: <CarOutlined /> },
  { label: 'Add Finish', desc: 'New finish for alloy models', to: '/add-finish', icon: <BgColorsOutlined /> },
  { label: 'Add Dealer', desc: 'Register a dealer account', to: '/add-dealer', icon: <UserAddOutlined /> },
  { label: 'Edit Dealer', desc: 'Update dealer details', to: '/edit-dealer', icon: <EditOutlined /> },
  { label: 'Dealers List', desc: 'Browse all dealers', to: '/dealers-list', icon: <UnorderedListOutlined /> }
]

/**
 * Data Entry home — the operator's operational start-of-day view.
 *
 * Answers, in order: (1) is there work WAITING on me (dispatched entries
 * without prices), (2) how is today going (entries, units, value, and where
 * the queued ones sit), (3) get me to the entry desk in one click.
 * Master-data actions are secondary.
 */
const EntryDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { allDailyEntries, loading: entriesLoading } = useSelector(s => s.entryDetails)
  const { dealersPagination, allDealers, loading: dealersLoading } = useSelector(s => s.stockDetails)

  const [pricingCount, setPricingCount] = useState(null)

  useEffect(() => {
    dispatch(getDailyEntry({}))
    dispatch(getAllDealers({}))
    dispatch(getPricingPendingEntriesAPI())
      .unwrap()
      .then(res => setPricingCount((res?.pricingEntries || []).length))
      .catch(() => setPricingCount(null))
  }, [dispatch])

  const today = useMemo(() => {
    const rows = allDailyEntries || []
    const queued = rows.filter(r => r.queueStatus)
    return {
      entries: rows.length,
      units: rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
      value: rows.reduce((s, r) => s + (r.isClaim ? 0 : Number(r.price) || 0), 0),
      toCoordinator: queued.filter(r => r.queueStatus === 'Sent to coordinator').length,
      inProduction: queued.filter(r => r.queueStatus === 'In production').length,
      awaitingStock: queued.filter(r => r.queueStatus === 'Awaiting stock').length,
      recent: rows.slice(0, 6)
    }
  }, [allDailyEntries])

  const dealersCount =
    dealersPagination?.total ?? (Array.isArray(allDealers) ? allDealers.length : null)

  const dash = v => (v === null || v === undefined ? '—' : v)

  return (
    <div style={{ width: '100%', fontFamily: FONT }}>
      {/* header: title + THE action */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <PageTitle>Data Entry</PageTitle>
        <button
          onClick={() => navigate('/add-daily-entry')}
          style={{
            height: 44, padding: '0 26px', borderRadius: 999, border: 'none',
            background: ORANGE, color: 'white', fontFamily: FONT,
            fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 10,
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}
        >
          Open Daily Entries <ArrowRightOutlined />
        </button>
      </div>

      {/* work waiting on the operator */}
      {pricingCount > 0 && (
        <div
          className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 mb-5"
          style={{ background: '#fff7ed', border: '1px solid rgba(242,108,45,0.3)' }}
        >
          <span className="text-sm" style={{ color: INK }}>
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: ORANGE }} />
            <strong>{pricingCount}</strong> dispatched {pricingCount === 1 ? 'entry is' : 'entries are'} waiting
            for prices — dealers aren't billed until you price them.
          </span>
          <button
            onClick={() => navigate('/data-entry-pricing')}
            style={{
              height: 34, padding: '0 16px', borderRadius: 999, border: 'none',
              background: ORANGE, color: 'white', fontFamily: FONT,
              fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >
            Price them →
          </button>
        </div>
      )}

      {/* today at a glance */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', maxWidth: 1100 }}>
        <KpiCard
          title="Today's Entries"
          value={entriesLoading ? '—' : today.entries}
          icon={<FileTextOutlined />}
          accentColor="orange"
          subMetric={
            today.entries > 0
              ? { label: `${today.units} units ·`, value: `₹${today.value.toLocaleString('en-IN')}` }
              : undefined
          }
        />
        <div onClick={() => navigate('/data-entry-pricing')} style={{ cursor: 'pointer' }}>
          <KpiCard
            title="Awaiting Pricing"
            value={dash(pricingCount)}
            icon={<TagOutlined />}
            accentColor={pricingCount > 0 ? 'red' : 'green'}
            subMetric={{
              label: pricingCount > 0 ? 'open the Pricing page' : 'queue is',
              value: pricingCount > 0 ? '→' : 'clear'
            }}
          />
        </div>
        <KpiCard
          title="In Queues Today"
          value={entriesLoading ? '—' : today.toCoordinator + today.inProduction + today.awaitingStock}
          icon={<ClockCircleOutlined />}
          accentColor="blue"
          subMetric={{
            label: `${today.toCoordinator} coordinator · ${today.inProduction} production ·`,
            value: `${today.awaitingStock} no stock`
          }}
        />
        <KpiCard
          title="Dealers"
          value={dealersLoading && dealersCount === null ? '—' : dash(dealersCount)}
          icon={<TeamOutlined />}
          accentColor="purple"
        />
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr minmax(320px, 38%)' }}>
        {/* quick actions — secondary to the entry desk */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: MUTED }}>
            Quick actions
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
            {QUICK_ACTIONS.map(a => (
              <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
                <div
                  className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                  style={{ borderColor: BORDER, background: 'white', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <span style={{ fontSize: 20, color: ORANGE, flexShrink: 0 }}>{a.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold truncate" style={{ color: INK }}>{a.label}</span>
                    <span className="block text-xs truncate" style={{ color: MUTED }}>{a.desc}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* recent activity */}
        <div className="bg-white rounded-[20px] border p-4" style={{ borderColor: BORDER, alignSelf: 'start' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: INK }}>Logged today</span>
            <Link to="/add-daily-entry" style={{ fontSize: 12, color: ORANGE, fontWeight: 500 }}>
              open the desk →
            </Link>
          </div>
          {today.recent.length === 0 ? (
            <div className="text-sm py-6 text-center" style={{ color: MUTED }}>
              Nothing yet — entries you add appear here.
            </div>
          ) : (
            today.recent.map((row, i) => (
              <div
                key={row.id || row.entryId || i}
                className="py-2"
                style={{ borderBottom: i < today.recent.length - 1 ? '1px solid #f0f0f0' : 'none' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate" style={{ color: INK }}>{row.productName}</span>
                  <span className="text-xs whitespace-nowrap" style={{ color: MUTED }}>
                    {row.quantity} × {row.isClaim
                      ? <span style={{ color: '#7c3aed', fontWeight: 500 }}>CLAIM</span>
                      : `₹${Number(row.price || 0).toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate" style={{ color: MUTED }}>{row.dealerName}</span>
                  {row.queueStatus && (
                    <span
                      className="text-[11px] px-2 rounded-full font-medium whitespace-nowrap"
                      style={{
                        background: row.queueStatus === 'Awaiting stock' ? '#fef2f2' : row.queueStatus === 'In production' ? '#ecfeff' : '#fff7ed',
                        color: row.queueStatus === 'Awaiting stock' ? '#b91c1c' : row.queueStatus === 'In production' ? '#0e7490' : ORANGE
                      }}
                    >
                      {row.queueStatus}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default EntryDashboard
