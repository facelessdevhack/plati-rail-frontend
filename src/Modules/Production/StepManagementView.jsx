import React, { useState, useEffect } from 'react'
import moment from 'moment'
import { Settings, PackagePlus, BarChart3 } from 'lucide-react'
import { client } from '../../Utils/axiosClient'

const FONT = "'Inter', sans-serif"
const INK = '#1a1a1a'
const MUTED = '#a0a0a8'
const BORDER = '#e5e5e5'
const ORANGE = '#f26c2d'
const GREEN = '#15803d'
const GREEN_DOT = '#4ecb71'
const RED = '#b91c1c'
const PURPLE = '#7c3aed'
const BLUE = '#1d4ed8'

const isInventoryStep = step =>
  step?.stepName?.toUpperCase().includes('REQUESTED FROM INVENTORY')

/**
 * Step Tracking for ONE job card — a vertical timeline the units flow down,
 * not a wide table. Same unit vocabulary as the plan hero: accepted (green),
 * in production (blue), rework (purple), rejected (red).
 *
 * The inventory step is MATERIAL-AWARE: it reads the job card's actual
 * inventory requests and stages its two actions so they can't be confused —
 * "Request materials" (ask the warehouse for stock) leads until the material
 * has arrived, then "Process" (push units to the next step) takes over.
 *
 * Prop-compatible with the previous table version; used by
 * ProductionPlanDetailsPage, JobCardDetailsModal/Page, ProductionPlanDetailsModal.
 */
const StepManagementView = ({
  jobCard,
  stepProgressData,
  onProcessStep,
  onRequestInventory,
  loading = false,
  planCompleted = false,
  isReworkPlan = false
}) => {
  const steps = [...(stepProgressData || [])].sort(
    (a, b) => (a.stepOrder || 0) - (b.stepOrder || 0)
  )

  const cardQty = parseInt(jobCard?.quantity) || 0
  const cardAccepted = parseInt(jobCard?.acceptedQuantity) || 0
  const cardRejected = parseInt(jobCard?.rejectedQuantity) || 0
  const cardRework = parseInt(jobCard?.reworkQuantity) || 0
  const cardInProd = Math.max(0, cardQty - cardAccepted - cardRejected - cardRework)

  // ── material state for the inventory step ──
  // null while loading; { requested, received } once known
  const jcId = jobCard?.jobCardId || jobCard?.id
  const hasInventoryStep = steps.some(isInventoryStep)
  const [material, setMaterial] = useState(null)

  useEffect(() => {
    // rework plans never raise material requests (their input is rejected
    // WIP already at the plant) — skip the fetch entirely
    if (!jcId || !hasInventoryStep || isReworkPlan) return
    let cancelled = false
    setMaterial(null)
    client
      .get('/production/inventory-requests', { params: { jobCardId: jcId } })
      .then(({ data }) => {
        if (cancelled) return
        const rows = Array.isArray(data) ? data : []
        setMaterial({
          requested: rows.reduce((s, r) => s + (parseInt(r.quantityRequested) || 0), 0),
          received: rows.reduce((s, r) => s + (parseInt(r.quantityReceived) || 0), 0)
        })
      })
      .catch(() => { if (!cancelled) setMaterial({ requested: null, received: null }) })
    return () => { cancelled = true }
    // stepProgressData in deps: parent reloads it after processing/requesting,
    // which is exactly when the material numbers may have moved
  }, [jcId, hasInventoryStep, isReworkPlan, stepProgressData]) // eslint-disable-line react-hooks/exhaustive-deps

  // 'skip' (rework / no inventory step) · 'loading' · 'unknown' (fetch failed)
  // · 'none' · 'waiting' · 'partial' · 'ready'
  const materialPhase = !hasInventoryStep || isReworkPlan
    ? 'skip'
    : material === null
    ? 'loading'
    : material.requested === null
    ? 'unknown'
    : material.requested === 0
    ? 'none'
    : material.received === 0
    ? 'waiting'
    : material.received < material.requested
    ? 'partial'
    : 'ready'

  // Where the units are stuck: the earliest step still holding pending units
  const bottleneck = steps.find(s => (s.pendingQuantity || 0) > 0) || null
  const firstStep = steps[0]
  const firstStepUnstarted =
    firstStep && (firstStep.inputQuantity || 0) === 0 && (firstStep.pendingQuantity || 0) === 0 && cardQty > 0

  // One sentence: what should the operator do with THIS card right now?
  // When the units are stuck at the inventory step, the answer depends on
  // whether the warehouse has issued the material yet.
  const nextAction = (() => {
    if (planCompleted) {
      return { tone: 'done', text: 'Plan completed — nothing left to process on this card.' }
    }
    if (bottleneck) {
      const qty = bottleneck.pendingQuantity
      const u = `unit${qty !== 1 ? 's' : ''}`
      if (isInventoryStep(bottleneck) && !['skip', 'loading', 'unknown'].includes(materialPhase)) {
        if (materialPhase === 'none') {
          return {
            tone: 'act',
            text: `First, request material for the ${qty} ${u} from the warehouse.`,
            actionLabel: 'Request materials',
            actionIcon: <PackagePlus className="h-3.5 w-3.5" />,
            onAction: () => onRequestInventory(bottleneck)
          }
        }
        if (materialPhase === 'waiting') {
          return {
            tone: 'act',
            text: `${material.requested} ${u} of material requested — waiting for the warehouse to issue them (Inventory Requests page).`
          }
        }
        if (materialPhase === 'partial') {
          // received units were auto-accepted here and already flowed to the
          // next step — point Process THERE, not at this step
          const afterInv = steps.find(
            s2 => (s2.stepOrder || 0) > (bottleneck.stepOrder || 0) && (s2.pendingQuantity || 0) > 0
          )
          return {
            tone: 'act',
            text: `${material.received} of ${material.requested} material units received and moved to ${afterInv ? afterInv.stepName : 'the next step'} — ${qty} still waiting for the warehouse.`,
            ...(afterInv
              ? {
                  actionLabel: 'Process',
                  actionIcon: <Settings className="h-3.5 w-3.5" />,
                  onAction: () => onProcessStep(afterInv)
                }
              : {})
          }
        }
        // 'ready' but units still pending here: the auto-advance was clamped
        // (some units were handled manually) — finish this step by hand
        return {
          tone: 'act',
          text: `Materials received — process the ${qty} ${u} at ${bottleneck.stepName}.`,
          actionLabel: 'Process',
          actionIcon: <Settings className="h-3.5 w-3.5" />,
          onAction: () => onProcessStep(bottleneck)
        }
      }
      return {
        tone: 'act',
        text: `${qty} ${u} waiting at ${bottleneck.stepName}`,
        actionLabel: 'Process',
        actionIcon: <Settings className="h-3.5 w-3.5" />,
        onAction: () => onProcessStep(bottleneck)
      }
    }
    if (firstStepUnstarted) {
      return {
        tone: 'act',
        text: `Start production — feed ${cardQty} unit${cardQty !== 1 ? 's' : ''} into ${firstStep.stepName}`,
        actionLabel: 'Process',
        actionIcon: <Settings className="h-3.5 w-3.5" />,
        onAction: () => onProcessStep(firstStep)
      }
    }
    if (steps.length > 0) {
      return { tone: 'done', text: 'All steps cleared — every unit on this card has been processed.' }
    }
    return null
  })()

  const pillButton = (label, icon, onClick, { primary = false, disabled = false } = {}) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 32, padding: '0 14px', borderRadius: 999,
        fontFamily: FONT, fontSize: 12.5, fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        border: primary ? 'none' : `1px solid ${BORDER}`,
        background: primary ? (disabled ? '#f5c9b3' : ORANGE) : 'white',
        color: primary ? 'white' : INK,
        opacity: !primary && disabled ? 0.5 : 1
      }}
    >
      {icon}
      {label}
    </button>
  )

  if (!steps.length) {
    return loading ? (
      <div className="flex items-center justify-center py-14">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: ORANGE }}></div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-14" style={{ fontFamily: FONT }}>
        <BarChart3 className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-base font-medium mb-1" style={{ color: INK }}>No steps initialized</p>
        <p className="text-slate-500 text-sm">This job card has no step progress records yet</p>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: FONT }}>
      {/* ── this card's unit flow — same bar as the plan hero ── */}
      <div className="rounded-2xl border px-4 py-3 mb-5" style={{ borderColor: BORDER, background: 'white' }}>
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
          <span className="text-sm font-semibold" style={{ color: INK }}>Units on this card</span>
          <span className="text-sm" style={{ color: MUTED }}>
            <span className="font-bold text-lg" style={{ color: INK }}>{cardAccepted.toLocaleString()}</span>
            {' '}/ {cardQty.toLocaleString()} accepted
          </span>
        </div>
        {cardQty > 0 && (
          <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-200 mb-2">
            {cardAccepted > 0 && <div className="bg-green-500" style={{ width: `${(cardAccepted / cardQty) * 100}%` }} />}
            {cardInProd > 0 && <div className="bg-blue-500" style={{ width: `${(cardInProd / cardQty) * 100}%` }} />}
            {cardRework > 0 && <div className="bg-purple-500" style={{ width: `${(cardRework / cardQty) * 100}%` }} />}
            {cardRejected > 0 && <div className="bg-red-500" style={{ width: `${(cardRejected / cardQty) * 100}%` }} />}
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-1">
          {cardAccepted > 0 && (
            <span className="text-green-700 font-medium"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />{cardAccepted} accepted</span>
          )}
          {cardInProd > 0 && (
            <span className="text-blue-700"><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />{cardInProd} in production</span>
          )}
          {cardRework > 0 && (
            <span className="text-purple-700 font-medium"><span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1" />{cardRework} in rework</span>
          )}
          {cardRejected > 0 && (
            <span className="text-red-700 font-medium"><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />{cardRejected} rejected</span>
          )}
        </div>

        {nextAction && (
          <div
            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 mt-2"
            style={{
              background: nextAction.tone === 'done' ? '#d9fae6' : '#fff7ed',
              border: `1px solid ${nextAction.tone === 'done' ? 'rgba(78,203,113,0.25)' : 'rgba(242,108,45,0.25)'}`
            }}
          >
            <span className="text-sm" style={{ color: INK }}>
              <span
                className="inline-block w-2 h-2 rounded-full mr-2"
                style={{ background: nextAction.tone === 'done' ? GREEN_DOT : ORANGE }}
              />
              <span className="font-semibold mr-1">Next:</span>
              {nextAction.text}
            </span>
            {nextAction.actionLabel && pillButton(
              nextAction.actionLabel,
              nextAction.actionIcon,
              nextAction.onAction,
              { primary: true }
            )}
          </div>
        )}
      </div>

      {/* ── the timeline the units flow down ── */}
      <div>
        {steps.map((step, i) => {
          const isFirstStep = step.stepOrder === 1 || i === 0
          const rawInput = step.inputQuantity || 0
          // first step bootstraps from the job card quantity
          const displayInput = rawInput === 0 && isFirstStep ? cardQty : rawInput
          const accepted = step.acceptedQuantity || 0
          const rejected = step.rejectedQuantity || 0
          const rework = step.reworkQuantity || 0
          const pending = step.pendingQuantity || 0

          const hasInput = rawInput > 0
          const hasPending = pending > 0
          const stepDone = hasInput && !hasPending
          const reached = hasInput || hasPending
          const isBottleneck = bottleneck && bottleneck.stepOrder === step.stepOrder
          const isLast = i === steps.length - 1

          // Old check (hasPending || hasInput) kept Process live on COMPLETED
          // steps (they retain input>0), and nothing considered plan completion
          const canProcess =
            !planCompleted &&
            !stepDone &&
            (hasPending || (isFirstStep && !hasInput && cardQty > 0))

          const invStep = isInventoryStep(step) && !isReworkPlan
          const canRequest =
            !planCompleted &&
            (hasInput || hasPending || (isFirstStep && cardQty > 0))

          // Stage the two inventory-step actions so their order is obvious:
          // Request leads until material exists, Process leads once it arrived
          const requestLeads = invStep && canProcess && materialPhase === 'none'
          const showRequestMore =
            invStep && canRequest && !stepDone &&
            ['waiting', 'partial', 'ready'].includes(materialPhase) &&
            (material?.requested ?? 0) < pending

          const materialLine = !invStep || stepDone ? null
            : materialPhase === 'loading' ? { color: MUTED, text: 'checking material requests…' }
            : materialPhase === 'unknown' ? null
            : materialPhase === 'none' ? { color: ORANGE, text: 'No material requested from the warehouse yet' }
            : materialPhase === 'waiting' ? { color: ORANGE, text: `${material.requested} units requested — waiting for the warehouse to issue them` }
            : materialPhase === 'partial' ? { color: BLUE, text: `${material.received} of ${material.requested} material units received — moved on to the next step` }
            : { color: GREEN, text: `✓ ${material.received} material units received from the warehouse` }

          // chip: green ✓ cleared · orange number where units wait · dark number
          // in-flight · hollow gray not reached
          const chipStyle = stepDone
            ? { background: '#d9fae6', color: GREEN, border: '1px solid rgba(78,203,113,0.4)' }
            : isBottleneck
            ? { background: ORANGE, color: 'white', border: '1px solid transparent' }
            : reached
            ? { background: INK, color: 'white', border: '1px solid transparent' }
            : { background: 'white', color: MUTED, border: `1px dashed #c9c9cf` }

          return (
            <div key={step.id || i} className="flex gap-3">
              {/* chip + connector */}
              <div className="flex flex-col items-center" style={{ width: 34, flexShrink: 0 }}>
                <div
                  className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
                  style={{ width: 34, height: 34, fontSize: 13, ...chipStyle }}
                >
                  {stepDone ? '✓' : step.stepOrder || i + 1}
                </div>
                {!isLast && (
                  <div
                    className="flex-1"
                    style={{
                      width: 2,
                      minHeight: 18,
                      background: stepDone ? GREEN_DOT : '#e5e5e5'
                    }}
                  />
                )}
              </div>

              {/* step body */}
              <div
                className="flex-1 rounded-2xl border px-4 py-3 mb-2.5"
                style={{
                  borderColor: isBottleneck ? 'rgba(242,108,45,0.45)' : BORDER,
                  background: isBottleneck ? '#fff7ed' : reached || stepDone ? 'white' : '#fafafa'
                }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: reached || stepDone ? INK : MUTED }}>
                        {step.stepName}
                      </span>
                      {isBottleneck && (
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(242,108,45,0.12)', color: ORANGE }}
                        >
                          {pending} waiting here
                        </span>
                      )}
                      {stepDone && !isBottleneck && (
                        <span className="text-[11px] font-medium" style={{ color: GREEN }}>✓ cleared</span>
                      )}
                    </div>

                    {/* worded unit line — only what actually happened */}
                    <div className="text-xs mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      {reached || (isFirstStep && cardQty > 0) ? (
                        <>
                          <span style={{ color: MUTED }}>{displayInput.toLocaleString()} in</span>
                          {accepted > 0 && <span style={{ color: GREEN, fontWeight: 500 }}>{accepted.toLocaleString()} {isLast ? 'accepted' : 'passed on'}</span>}
                          {rejected > 0 && <span style={{ color: RED, fontWeight: 500 }}>{rejected.toLocaleString()} rejected</span>}
                          {rework > 0 && <span style={{ color: PURPLE, fontWeight: 500 }}>{rework.toLocaleString()} rework (legacy)</span>}
                          {pending > 0 && !isBottleneck && <span style={{ color: BLUE, fontWeight: 500 }}>{pending.toLocaleString()} waiting</span>}
                        </>
                      ) : (
                        <span style={{ color: MUTED }}>not reached yet</span>
                      )}
                    </div>

                    {/* material status — what the warehouse has actually done */}
                    {materialLine && (
                      <div className="text-xs mt-1 font-medium" style={{ color: materialLine.color }}>
                        {materialLine.text}
                      </div>
                    )}

                    {/* unreached steps carry an initialization timestamp — noise */}
                    {reached && (step.rejectionReason || step.processedAt) && (
                      <div className="text-xs mt-1" style={{ color: MUTED }}>
                        {step.rejectionReason && <span className="italic">"{step.rejectionReason}"</span>}
                        {step.rejectionReason && step.processedAt && ' · '}
                        {step.processedAt && moment(step.processedAt).format('DD MMM YYYY, HH:mm')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* inventory step: Request leads until material exists */}
                    {invStep && !planCompleted && !stepDone && (requestLeads || showRequestMore) &&
                      pillButton(
                        requestLeads ? 'Request materials' : 'Request more',
                        <PackagePlus className="h-3.5 w-3.5" />,
                        () => onRequestInventory(step),
                        { primary: requestLeads, disabled: !canRequest }
                      )}
                    {canProcess
                      ? pillButton(
                          'Process',
                          <Settings className="h-3.5 w-3.5" />,
                          () => onProcessStep(step),
                          // on the inventory step, Process is secondary while
                          // the remaining units still wait on the warehouse
                          { primary: !requestLeads && !(invStep && ['waiting', 'partial'].includes(materialPhase)) }
                        )
                      : !stepDone && (
                        // cleared rows already say "✓ cleared" next to the name
                        <span className="text-xs whitespace-nowrap" style={{ color: MUTED }}>
                          {planCompleted ? 'Plan completed' : 'Awaiting input'}
                        </span>
                      )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StepManagementView
