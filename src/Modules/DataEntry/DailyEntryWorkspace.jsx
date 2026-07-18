import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Select, message } from 'antd'
import moment from 'moment'

import PageTitle from '../../Core/Components/PageTitle'
import TabBar from '../../Core/Components/TabBar'
import { client } from '../../Utils/axiosClient'
import { getDealersDropdown, getAllProducts } from '../../redux/api/stockAPI'
import {
  addEntryAPI,
  editEntryAPI,
  addCoordinatedEntryAPI,
  getDailyEntry,
  getPaymentDailyEntry,
  getChargesDailyEntry,
  getPaymentMethods
} from '../../redux/api/entriesAPI'
import {
  setEntry,
  resetEntry,
  setEditing,
  setPMEntry,
  resetPMEntry,
  setChargesEntry,
  resetChargesEntry
} from '../../redux/slices/entry.slice'

const FONT = "'Inter', sans-serif"
const INK = '#1a1a1a'
const MUTED = '#a0a0a8'
const BORDER = '#e5e5e5'
const ORANGE = '#f26c2d'

// tab key → product-list type param + entry product_type fallback
const PRODUCT_TABS = {
  alloys: { label: 'Alloys', type: 1 },
  tyres: { label: 'Tyres', type: 2 },
  caps: { label: 'Caps', type: 3 },
  ppf: { label: 'PPF', type: 4 }
}

// entries are logged for the previous WORKING day (Sunday → Saturday)
const previousWorkingDay = () => {
  let d = moment().subtract(1, 'days')
  if (d.day() === 0) d = d.subtract(1, 'days')
  return d
}

const SectionLabel = ({ children }) => (
  <div
    className="text-[11px] font-semibold uppercase tracking-wide mb-1"
    style={{ color: MUTED, fontFamily: FONT }}
  >
    {children}
  </div>
)

const inputStyle = {
  width: '100%',
  height: 38,
  border: `1px solid ${BORDER}`,
  borderRadius: 999,
  padding: '0 16px',
  fontSize: 14,
  fontFamily: FONT,
  color: INK,
  outline: 'none',
  background: 'white'
}

const TogglePill = ({ active, onClick, children, tone = 'orange' }) => (
  <button
    onClick={onClick}
    style={{
      height: 32,
      padding: '0 14px',
      borderRadius: 999,
      fontFamily: FONT,
      fontSize: 12.5,
      fontWeight: 500,
      cursor: 'pointer',
      border: `1px solid ${active ? 'transparent' : BORDER}`,
      background: active ? (tone === 'purple' ? '#7c3aed' : ORANGE) : 'white',
      color: active ? 'white' : INK
    }}
  >
    {children}
  </button>
)

/**
 * Daily Entries — one desk for the operator's whole day.
 *
 * The old flow spread one dealer's day across six pages (four near-identical
 * product forms + payments + charges). Here the DEALER is picked once and
 * survives submits and tab switches; the entry type is a tab; the right panel
 * shows what has already been logged today with per-dealer totals.
 */
const DailyEntryWorkspace = ({ initialTab = 'alloys' }) => {
  const dispatch = useDispatch()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [submitting, setSubmitting] = useState(false)
  const createRequestRef = useRef(null)

  const {
    entry,
    isEditing,
    editingEntryId,
    allDailyEntries,
    pmEntry,
    allPaymentDailyEntries,
    chargesEntry,
    allChargesDailyEntries,
    allPaymentMethods
  } = useSelector(state => state.entryDetails)
  const { dealersDropdown, allProducts } = useSelector(state => state.stockDetails)

  const isProductTab = !!PRODUCT_TABS[activeTab]

  // ── the sticky dealer: one source of truth across all drafts ──
  const dealerId = entry.dealerId || pmEntry?.dealerId || chargesEntry?.dealerId || null
  const dealerName = entry.dealerName || pmEntry?.dealerName || chargesEntry?.dealerName || null

  const setDealer = (id, label) => {
    dispatch(setEntry({ dealerId: id, dealerName: label }))
    dispatch(setPMEntry({ dealerId: id, dealerName: label }))
    dispatch(setChargesEntry({ dealerId: id, dealerName: label }))
  }

  const entryDate = entry?.date || previousWorkingDay().format('YYYY-MM-DD HH:mm:ss')

  useEffect(() => {
    dispatch(getDealersDropdown({}))
    dispatch(getPaymentMethods({}))
    dispatch(getDailyEntry({}))
    dispatch(getPaymentDailyEntry({}))
    dispatch(getChargesDailyEntry({}))
    if (!entry?.date) {
      dispatch(setEntry({ date: previousWorkingDay().format('YYYY-MM-DD HH:mm:ss') }))
    }
    if (!pmEntry?.payment_date) {
      dispatch(setPMEntry({ payment_date: previousWorkingDay().format('YYYY-MM-DD') }))
    }
    if (!chargesEntry?.payment_date) {
      dispatch(setChargesEntry({ payment_date: previousWorkingDay().format('YYYY-MM-DD') }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // product list follows the active product tab
  useEffect(() => {
    if (isProductTab) dispatch(getAllProducts({ type: PRODUCT_TABS[activeTab].type }))
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── submit: product entry (alloys use the coordinated route with stock
  // routing; the rest keep the legacy direct API — behavior preserved) ──
  const submitProductEntry = async () => {
    if (!dealerId) return message.warning('Select a dealer first')
    if (!entry.productId) return message.warning('Select a product')
    if (!entry.quantity) return message.warning('Enter a quantity')
    if (entry.isClaim && entry.price !== 0) return message.warning('Price must be 0 on a claim')
    if (!entry.isClaim && (entry.price === null || entry.price === undefined || entry.price === ''))
      return message.warning('Enter a price (0 is allowed)')
    if (entry.transportationType && entry.transportationCharges === null)
      return message.warning('Enter the transportation charges')

    setSubmitting(true)
    try {
      if (isEditing) {
        const res = await editEntryAPI({
          ...entry,
          id: editingEntryId || entry.entryId,
          sourceType: entry.sourceType
        })
        if (res.status === 200) {
          message.success('Entry updated')
          dispatch(setEditing({ isEditing: false, editingEntryId: null }))
        }
      } else if (activeTab === 'alloys') {
        const payload = { ...entry }
        const payloadFingerprint = JSON.stringify(payload)
        if (createRequestRef.current?.fingerprint !== payloadFingerprint) {
          const randomPart = window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
          createRequestRef.current = {
            fingerprint: payloadFingerprint,
            requestId: `sales-${Date.now()}-${randomPart}`
          }
        }
        payload.requestId = createRequestRef.current.requestId
        const res = await addCoordinatedEntryAPI(payload)
        if (res.status === 200 || res.status === 201) {
          const routed = res.data?.routedTo
          const messages = {
            entry_master: 'Added — stock available, sent to dispatch queue',
            dispatch_entries: 'Added — stock available, sent to dispatch queue',
            currently_inprod_master: 'Added — product is in production, queued',
            pending_entry_master: 'Added as PENDING — out of stock and not in production'
          }
          message.success(messages[routed] || 'Entry added')
          createRequestRef.current = null
        }
      } else {
        const res = await addEntryAPI({ ...entry })
        if (res.status === 200 || res.status === 201) message.success('Entry added')
      }

      // keep dealer + date (the operator logs several entries per dealer);
      // clear only the per-entry fields
      const keepDate = entry.date
      dispatch(resetEntry())
      dispatch(setEntry({ dealerId, dealerName, date: keepDate }))
      dispatch(getDailyEntry({}))
    } catch (e) {
      message.error(e?.response?.data?.message || e?.message || 'Failed to add entry')
    } finally {
      setSubmitting(false)
    }
  }

  const submitPayment = async () => {
    if (!dealerId) return message.warning('Select a dealer first')
    if (!pmEntry?.description) return message.warning('Enter a description')
    if (!pmEntry?.amount) return message.warning('Enter an amount')
    if (!pmEntry?.payment_date) return message.warning('Pick the payment date')
    if (!pmEntry?.paymentMethod) return message.warning('Pick a payment method')

    setSubmitting(true)
    try {
      await client.post('entries/create-pm-entry', { ...pmEntry })
      message.success('Payment recorded')
      const keep = { dealerId, dealerName, payment_date: pmEntry.payment_date }
      dispatch(resetPMEntry())
      dispatch(setPMEntry(keep))
      dispatch(getPaymentDailyEntry({}))
    } catch (e) {
      message.error(e?.response?.data?.message || 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  const submitCharges = async () => {
    if (!dealerId) return message.warning('Select a dealer first')
    if (!chargesEntry?.description) return message.warning('Enter a description')
    if (!chargesEntry?.amount) return message.warning('Enter an amount')
    if (!chargesEntry?.payment_date) return message.warning('Pick the date')

    setSubmitting(true)
    try {
      await client.post('entries/create-charges-entry', { ...chargesEntry })
      message.success('Charge recorded')
      const keep = { dealerId, dealerName, payment_date: chargesEntry.payment_date }
      dispatch(resetChargesEntry())
      dispatch(setChargesEntry(keep))
      dispatch(getChargesDailyEntry({}))
    } catch (e) {
      message.error(e?.response?.data?.message || 'Failed to record charge')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditEntry = row => {
    dispatch(setEntry(row))
    dispatch(setEditing({ isEditing: true, editingEntryId: row.id }))
    const tab = Object.keys(PRODUCT_TABS).find(
      k => PRODUCT_TABS[k].type === Number(row.productType)
    )
    if (tab) setActiveTab(tab)
  }

  const cancelEdit = () => {
    const keepDate = entry.date
    dispatch(resetEntry())
    dispatch(setEntry({ dealerId, dealerName, date: keepDate }))
    dispatch(setEditing({ isEditing: false, editingEntryId: null }))
  }

  // ── right panel data ──
  const panelRows = isProductTab
    ? allDailyEntries || []
    : activeTab === 'payment'
      ? allPaymentDailyEntries || []
      : allChargesDailyEntries || []

  const grouped = useMemo(() => {
    const byDealer = {}
    for (const row of panelRows) {
      const name = row.dealerName || 'Unknown dealer'
      if (!byDealer[name]) byDealer[name] = []
      byDealer[name].push(row)
    }
    // selected dealer's group first, rest as-is
    return Object.entries(byDealer).sort(([a], [b]) => {
      if (a === dealerName) return -1
      if (b === dealerName) return 1
      return 0
    })
  }, [panelRows, dealerName])

  const todayTotals = useMemo(() => {
    const rows = allDailyEntries || []
    return {
      entries: rows.length,
      units: rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
      value: rows.reduce(
        (s, r) => s + (r.isClaim ? 0 : (Number(r.price) || 0)),
        0
      )
    }
  }, [allDailyEntries])

  const paymentMethodLabel = id =>
    allPaymentMethods?.find(m => m.id === id)?.methodName || '—'

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', fontFamily: FONT }}>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <PageTitle>Daily Entries</PageTitle>
        <div
          className="rounded-full px-4 flex items-center gap-2"
          style={{ height: 38, background: '#fff7ed', border: '1px solid rgba(242,108,45,0.25)', marginTop: 8 }}
        >
          <span className="text-sm" style={{ color: INK }}>
            Logging for <strong>{moment(entryDate).format('DD MMM YYYY')}</strong>
          </span>
          <span className="text-xs" style={{ color: MUTED }}>· previous working day</span>
          <input
            type="date"
            value={moment(entryDate).format('YYYY-MM-DD')}
            onChange={e => {
              const d = e.target.value
              dispatch(setEntry({ date: `${d} 10:00:00` }))
              dispatch(setPMEntry({ payment_date: d }))
              dispatch(setChargesEntry({ payment_date: d }))
            }}
            style={{ border: 'none', background: 'transparent', fontFamily: FONT, fontSize: 13, color: ORANGE, cursor: 'pointer', width: 130 }}
          />
        </div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'minmax(380px, 46%) 1fr' }}>
        {/* ── ENTRY PAD ── */}
        <div className="bg-white rounded-[20px] border p-5" style={{ borderColor: BORDER, alignSelf: 'start' }}>
          <SectionLabel>Dealer — stays selected between entries</SectionLabel>
          <Select
            showSearch
            allowClear
            className="w-full plati-filter-dealer"
            style={{ width: '100%', marginBottom: 14 }}
            size="large"
            options={dealersDropdown || []}
            value={dealerId}
            placeholder="Search and select a dealer…"
            optionFilterProp="label"
            onChange={(v, opt) => setDealer(v || null, opt?.label || null)}
          />

          <TabBar
            tabs={[
              { key: 'alloys', label: 'Alloys' },
              { key: 'tyres', label: 'Tyres' },
              { key: 'caps', label: 'Caps' },
              { key: 'ppf', label: 'PPF' },
              { key: 'payment', label: 'Payment' },
              { key: 'charges', label: 'Charges' }
            ]}
            activeKey={activeTab}
            onChange={key => {
              if (isEditing) cancelEdit()
              setActiveTab(key)
            }}
          />

          {isProductTab && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <SectionLabel>Product ({PRODUCT_TABS[activeTab].label})</SectionLabel>
                <Select
                  showSearch
                  className="w-full"
                  size="large"
                  options={allProducts || []}
                  value={entry.productId}
                  placeholder={`Search ${PRODUCT_TABS[activeTab].label.toLowerCase()}…`}
                  optionFilterProp="label"
                  onChange={(v, opt) =>
                    dispatch(
                      setEntry({
                        productId: v,
                        productName: opt ? opt.label : null,
                        productType: opt?.type ?? PRODUCT_TABS[activeTab].type
                      })
                    )
                  }
                />
              </div>

              <div>
                <SectionLabel>Quantity</SectionLabel>
                <input
                  type="number"
                  min={1}
                  style={inputStyle}
                  value={entry.quantity ?? ''}
                  onChange={e => dispatch(setEntry({ quantity: +e.target.value }))}
                />
              </div>
              <div>
                <SectionLabel>Price (line total ₹)</SectionLabel>
                <input
                  type="number"
                  style={{ ...inputStyle, background: entry.isClaim ? '#f3f3f5' : 'white' }}
                  disabled={entry.isClaim}
                  placeholder={entry.isClaim ? 'Claim — no charge' : ''}
                  value={entry.isClaim ? '' : entry.price ?? ''}
                  onChange={e => dispatch(setEntry({ price: +e.target.value, isClaim: false }))}
                />
              </div>

              <div className="col-span-2">
                <SectionLabel>Transport</SectionLabel>
                <div className="flex items-center gap-2 flex-wrap">
                  {['', 'Transport', 'Bus'].map(t => (
                    <TogglePill
                      key={t || 'none'}
                      active={(entry.transportationType || '') === t}
                      onClick={() => dispatch(setEntry({ transportationType: t, ...(t === '' ? { transportationCharges: null } : {}) }))}
                    >
                      {t === '' ? 'None' : t}
                    </TogglePill>
                  ))}
                  {entry.transportationType && (
                    <input
                      type="number"
                      placeholder="charges ₹"
                      style={{ ...inputStyle, width: 140, height: 32 }}
                      value={entry.transportationCharges ?? ''}
                      onChange={e => dispatch(setEntry({ transportationCharges: +e.target.value }))}
                    />
                  )}
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <TogglePill
                  active={!!entry.isClaim}
                  tone="purple"
                  onClick={() =>
                    dispatch(setEntry({ isClaim: !entry.isClaim, price: !entry.isClaim ? 0 : null }))
                  }
                >
                  Warranty claim
                </TogglePill>
                <TogglePill
                  active={!!entry.isRepair}
                  tone="purple"
                  onClick={() => dispatch(setEntry({ isRepair: !entry.isRepair }))}
                >
                  Repair
                </TogglePill>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <SectionLabel>Description</SectionLabel>
                <input
                  style={inputStyle}
                  value={pmEntry?.description ?? ''}
                  placeholder="e.g. CASH, cheque no…"
                  onChange={e => dispatch(setPMEntry({ description: e.target.value }))}
                />
              </div>
              <div>
                <SectionLabel>Amount (₹)</SectionLabel>
                <input
                  type="number"
                  style={inputStyle}
                  value={pmEntry?.amount ?? ''}
                  onChange={e => dispatch(setPMEntry({ amount: +e.target.value }))}
                />
              </div>
              <div>
                <SectionLabel>Payment date</SectionLabel>
                <input
                  type="date"
                  style={inputStyle}
                  value={pmEntry?.payment_date ?? ''}
                  onChange={e => dispatch(setPMEntry({ payment_date: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <SectionLabel>Method</SectionLabel>
                <div className="flex items-center gap-2 flex-wrap">
                  {(allPaymentMethods || []).map(m => (
                    <TogglePill
                      key={m.id}
                      active={pmEntry?.paymentMethod === m.id}
                      onClick={() => dispatch(setPMEntry({ paymentMethod: m.id }))}
                    >
                      {m.methodName}
                    </TogglePill>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'charges' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <SectionLabel>Description</SectionLabel>
                <input
                  style={inputStyle}
                  value={chargesEntry?.description ?? ''}
                  placeholder="what is this charge for?"
                  onChange={e => dispatch(setChargesEntry({ description: e.target.value }))}
                />
              </div>
              <div>
                <SectionLabel>Amount (₹)</SectionLabel>
                <input
                  type="number"
                  style={inputStyle}
                  value={chargesEntry?.amount ?? ''}
                  onChange={e => dispatch(setChargesEntry({ amount: +e.target.value }))}
                />
              </div>
              <div>
                <SectionLabel>Date</SectionLabel>
                <input
                  type="date"
                  style={inputStyle}
                  value={chargesEntry?.payment_date ?? ''}
                  onChange={e => dispatch(setChargesEntry({ payment_date: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 mt-5">
            {isEditing && (
              <button
                onClick={cancelEdit}
                style={{
                  height: 38, padding: '0 18px', borderRadius: 999,
                  border: `1px solid ${BORDER}`, background: 'white', color: INK,
                  fontFamily: FONT, fontSize: 14, fontWeight: 500, cursor: 'pointer'
                }}
              >
                Cancel edit
              </button>
            )}
            <button
              onClick={
                isProductTab ? submitProductEntry
                : activeTab === 'payment' ? submitPayment
                : submitCharges
              }
              disabled={submitting}
              style={{
                height: 38, padding: '0 22px', borderRadius: 999, border: 'none',
                background: submitting ? '#f5c9b3' : ORANGE, color: 'white',
                fontFamily: FONT, fontSize: 14, fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Saving…' : isEditing ? 'Update entry' : 'Add entry'}
            </button>
          </div>
        </div>

        {/* ── TODAY SO FAR ── */}
        <div className="bg-white rounded-[20px] border p-5" style={{ borderColor: BORDER }}>
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
            <span className="text-base font-semibold" style={{ color: INK }}>Today so far</span>
            {isProductTab && (
              <span className="text-sm" style={{ color: MUTED }}>
                {todayTotals.entries} entries · {todayTotals.units} units ·{' '}
                <strong style={{ color: INK }}>₹{todayTotals.value.toLocaleString('en-IN')}</strong>
              </span>
            )}
          </div>

          {grouped.length === 0 && (
            <div className="text-center py-12" style={{ color: MUTED }}>
              Nothing logged yet — entries appear here as you add them.
            </div>
          )}

          <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
            {grouped.map(([name, rows]) => {
              const isCurrent = name === dealerName
              const dealerValue = rows.reduce(
                (s, r) => s + (r.isClaim ? 0 : (Number(r.price) || Number(r.amount) || 0)),
                0
              )
              return (
                <div key={name} className="mb-4">
                  <div
                    className="flex items-center justify-between rounded-xl px-3 py-2 mb-2"
                    style={{
                      background: isCurrent ? '#fff7ed' : '#f8fafc',
                      border: `1px solid ${isCurrent ? 'rgba(242,108,45,0.35)' : BORDER}`
                    }}
                  >
                    <span className="font-semibold text-sm" style={{ color: INK }}>
                      {name}
                      {isCurrent && (
                        <span className="ml-2 text-[11px] font-medium" style={{ color: ORANGE }}>
                          selected
                        </span>
                      )}
                    </span>
                    <span className="text-xs" style={{ color: MUTED }}>
                      {rows.length} {rows.length === 1 ? 'entry' : 'entries'} ·{' '}
                      ₹{dealerValue.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {rows.map((row, i) => (
                    <div
                      key={row.id || row.entryId || i}
                      className="flex items-center justify-between px-3 py-2 rounded-xl mb-1"
                      style={{
                        border: `1px solid ${row.id === editingEntryId ? 'rgba(242,108,45,0.5)' : '#f0f0f0'}`,
                        background: row.id === editingEntryId ? '#fff7ed' : 'white'
                      }}
                    >
                      <div className="min-w-0">
                        <div className="text-sm truncate" style={{ color: INK }}>
                          {isProductTab
                            ? row.productName
                            : activeTab === 'payment'
                              ? `${row.description || ''} — ${paymentMethodLabel(row.paymentMethod)}`
                              : row.description}
                        </div>
                        <div className="text-xs" style={{ color: MUTED }}>
                          {isProductTab ? (
                            <>
                              {row.quantity} × {row.isClaim
                                ? <span style={{ color: '#7c3aed', fontWeight: 500 }}>CLAIM</span>
                                : `₹${Number(row.price || 0).toLocaleString('en-IN')}`}
                              {row.transportationType ? ` · ${row.transportationType} ₹${row.transportationCharges || 0}` : ''}
                              {row.isRepair ? ' · repair' : ''}
                              {row.queueStatus && (
                                <span
                                  className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-medium"
                                  style={{
                                    background: row.queueStatus === 'Awaiting stock' ? '#fef2f2' : row.queueStatus === 'In production' ? '#ecfeff' : '#fff7ed',
                                    color: row.queueStatus === 'Awaiting stock' ? '#b91c1c' : row.queueStatus === 'In production' ? '#0e7490' : ORANGE
                                  }}
                                >
                                  {row.queueStatus}
                                </span>
                              )}
                            </>
                          ) : (
                            <>₹{Number(row.amount || 0).toLocaleString('en-IN')}</>
                          )}
                        </div>
                      </div>
                      {isProductTab && !row.queueStatus && (
                        <button
                          onClick={() => handleEditEntry(row)}
                          style={{
                            height: 28, padding: '0 12px', borderRadius: 999,
                            border: `1px solid ${BORDER}`, background: 'white', color: INK,
                            fontFamily: FONT, fontSize: 12, fontWeight: 500,
                            cursor: 'pointer', flexShrink: 0, marginLeft: 8
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyEntryWorkspace
