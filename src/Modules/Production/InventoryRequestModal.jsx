import React, { useState, useEffect } from 'react'
import { Modal, InputNumber } from 'antd'
import { PackagePlus } from 'lucide-react'
import { client } from '../../Utils/axiosClient'

const FONT = "'Inter', sans-serif"
const INK = '#1a1a1a'
const MUTED = '#a0a0a8'
const BORDER = '#e5e5e5'
const ORANGE = '#f26c2d'

const SectionLabel = ({ children }) => (
  <p
    className="text-[11px] font-semibold uppercase tracking-wide m-0 mb-0.5"
    style={{ color: MUTED, fontFamily: FONT }}
  >
    {children}
  </p>
)

/**
 * Request source material from the warehouse for a job card.
 *
 * The real cap is the PLAN's material budget (plan quantity minus everything
 * already requested across all its job cards) — the backend enforces it
 * hard, so the modal shows the same numbers instead of letting the user
 * find out via a 400.
 */
const InventoryRequestModal = ({
  visible,
  onCancel,
  onSubmit,
  stepProgress,
  jobCard,
  planId,
  planQuantity,
  planAlloyName,
  loading = false
}) => {
  const [requestedQty, setRequestedQty] = useState(0)
  const [budget, setBudget] = useState(null) // { alreadyRequested, remaining } | null while loading

  const stepQty = stepProgress?.pendingQuantity || stepProgress?.inputQuantity || jobCard?.quantity || 0

  useEffect(() => {
    if (!visible) return
    setBudget(null)
    let cancelled = false
    const loadBudget = async () => {
      try {
        if (!planId || !planQuantity) {
          // no plan context — fall back to the step quantity as the only cap
          if (!cancelled) setBudget({ alreadyRequested: null, remaining: null })
          return
        }
        const { data } = await client.get('/production/inventory-requests', {
          params: { planId }
        })
        const alreadyRequested = (Array.isArray(data) ? data : []).reduce(
          (s, r) => s + (parseInt(r.quantityRequested) || 0), 0
        )
        if (!cancelled) {
          setBudget({
            alreadyRequested,
            remaining: Math.max(0, (parseInt(planQuantity) || 0) - alreadyRequested)
          })
        }
      } catch (e) {
        if (!cancelled) setBudget({ alreadyRequested: null, remaining: null })
      }
    }
    loadBudget()
    return () => { cancelled = true }
  }, [visible, planId, planQuantity])

  // hard cap = the plan's remaining budget when known, else the step quantity;
  // sensible default = the units at this step, clamped to the cap
  const cap = budget?.remaining ?? stepQty
  const defaultQty = Math.min(stepQty > 0 ? stepQty : cap, cap)

  useEffect(() => {
    if (visible && budget !== null) {
      setRequestedQty(defaultQty > 0 ? defaultQty : 0)
    }
  }, [visible, budget]) // eslint-disable-line react-hooks/exhaustive-deps

  const overBudget = requestedQty > cap
  const canSubmit = requestedQty > 0 && !overBudget

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      stepProgressId: stepProgress.id,
      jobCardId: jobCard?.jobCardId || jobCard?.id,
      alloyId: jobCard?.alloyId || jobCard?.alloy_id,
      alloyName: jobCard?.alloyName || jobCard?.alloy_name || jobCard?.productName || planAlloyName || null,
      quantityRequested: requestedQty
    })
  }

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={560}
      destroyOnClose
      centered
      styles={{ content: { borderRadius: 20, padding: 24 } }}
    >
      <div style={{ fontFamily: FONT }}>
        {/* header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl" style={{ background: ORANGE }}>
            <PackagePlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold" style={{ color: INK }}>Request materials</div>
            <div className="text-sm" style={{ color: MUTED }}>
              Ask the warehouse to issue source material for this job card
            </div>
          </div>
        </div>

        {/* context card */}
        <div className="rounded-2xl border p-4 mb-4" style={{ borderColor: BORDER, background: '#f8fafc' }}>
          <div className="mb-3">
            <SectionLabel>Source material</SectionLabel>
            <div className="text-sm font-semibold" style={{ color: INK }}>
              {jobCard?.alloyName || jobCard?.alloy_name || jobCard?.productName || planAlloyName || `Alloy #${jobCard?.alloyId || jobCard?.alloy_id || '?'}`}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <SectionLabel>Job card</SectionLabel>
              <div className="text-sm font-semibold" style={{ color: INK }}>#{jobCard?.jobCardId || jobCard?.id}</div>
            </div>
            <div>
              <SectionLabel>Step</SectionLabel>
              <div className="text-sm font-semibold" style={{ color: INK }}>{stepProgress?.stepName || '—'}</div>
            </div>
            <div>
              <SectionLabel>Units at this step</SectionLabel>
              <div className="text-sm font-semibold" style={{ color: INK }}>{stepQty.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* material budget — the number the backend actually enforces */}
        <div
          className="rounded-2xl border px-4 py-3 mb-4"
          style={{
            borderColor: overBudget ? 'rgba(229,62,62,0.35)' : 'rgba(242,108,45,0.25)',
            background: overBudget ? '#fef2f2' : '#fff7ed'
          }}
        >
          {budget === null ? (
            <span className="text-sm" style={{ color: MUTED }}>Checking the plan's material budget…</span>
          ) : budget.remaining === null ? (
            <span className="text-sm" style={{ color: INK }}>
              Up to <strong>{stepQty.toLocaleString()}</strong> units can be requested for this step.
            </span>
          ) : (
            <span className="text-sm" style={{ color: INK }}>
              <span className="font-semibold">Material budget:</span>{' '}
              {budget.alreadyRequested.toLocaleString()} of {parseInt(planQuantity).toLocaleString()} plan units already requested
              {' · '}
              <span className="font-semibold" style={{ color: overBudget ? '#e53e3e' : ORANGE }}>
                {budget.remaining.toLocaleString()} remaining
              </span>
              {budget.remaining === 0 && ' — nothing left to request on this plan'}
            </span>
          )}
        </div>

        {/* quantity */}
        <div className="mb-4">
          <SectionLabel>Quantity to request</SectionLabel>
          <InputNumber
            min={0}
            max={cap}
            value={requestedQty}
            onChange={v => setRequestedQty(parseInt(v) || 0)}
            className="w-full"
            size="large"
            addonAfter="units"
            disabled={budget !== null && cap === 0}
          />
          {overBudget && (
            <div className="text-xs mt-1" style={{ color: '#e53e3e' }}>
              Exceeds the plan's remaining material budget ({cap} units)
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            style={{
              height: 38, padding: '0 20px', borderRadius: 999,
              border: `1px solid ${BORDER}`, background: 'white', color: INK,
              fontFamily: FONT, fontSize: 14, fontWeight: 500, cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            style={{
              height: 38, padding: '0 22px', borderRadius: 999, border: 'none',
              background: !canSubmit || loading ? '#f5c9b3' : ORANGE, color: 'white',
              fontFamily: FONT, fontSize: 14, fontWeight: 500,
              cursor: !canSubmit || loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Submitting…' : `Request ${requestedQty > 0 ? requestedQty.toLocaleString() + ' units' : 'materials'}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default InventoryRequestModal
