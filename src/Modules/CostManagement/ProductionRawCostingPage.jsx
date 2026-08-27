import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Empty,
  InputNumber,
  Progress,
  Segmented,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message
} from 'antd'
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  WarningOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

import PageTitle from '../../Core/Components/PageTitle'
import { client } from '../../Utils/axiosClient'

const { Text, Title } = Typography
const BORDER = '#e5e7eb'
const MUTED = '#667085'
const INK = '#182230'
const ORANGE = '#f26c2d'
const GREEN = '#159455'

const emptySummary = {
  affectedPlans: 0,
  pricingPlans: 0,
  missingIssuePlans: 0,
  directIssueGapPlans: 0,
  reworkLineagePlans: 0,
  readyForReplayPlans: 0,
  partialIssueGapPlans: 0,
  partialIssueGapQty: 0,
  uniqueRawLayers: 0,
  rawLayersNeedingPrice: 0,
  manuallyApprovedRawLayers: 0,
  alreadyPricedRawLayers: 0,
  importedPurchaseFallbackLayers: 0,
  importedPurchasePricingReadyLayers: 0,
  importedPurchaseMatchedQty: 0,
  tallyFallbackLayers: 0,
  tallyFallbackPricingReadyLayers: 0,
  tallyFallbackMatchedQty: 0,
  reworkRawLayers: 0,
  reworkRawLayersNeedingPrice: 0,
  reworkRawLayersSharedWithPricing: 0,
  rawIssueQty: 0,
  pendingRawIssueQty: 0,
  pendingSoldQty: 0,
  affectedSales: 0,
  stagedIssueRepairs: 0,
  pricedIssueRepairs: 0,
  directIssuePricesNeeded: 0,
  reworkLineageReadyPlans: 0
}

const emptyExactOnlySummary = {
  salesPieces: 0,
  salesEntries: 0,
  currentExactPieces: 0,
  currentAveragePieces: 0,
  currentPendingPieces: 0,
  currentExactPercent: 0,
  nonExactPieces: 0,
  affectedSales: 0,
  affectedProductionPlans: 0,
  projectedExactPieces: 0,
  projectedExactPercent: 0,
  sources: 0,
  openSources: 0,
  unresolvedSources: 0,
  evidenceReadySources: 0,
  stagedSources: 0,
  lineageBlockedSources: 0,
  openingSources: 0,
  directlyApprovableSources: 0,
  readyForControlledReplay: false
}

const formatQty = value => `${Number(value || 0).toLocaleString('en-IN')} Pcs`
const formatMoney = value => Number(value || 0).toLocaleString('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})
const formatDate = value => value ? dayjs(value).format('DD MMM YYYY') : '—'
const formatDateTime = value => value ? dayjs(value).format('DD MMM YYYY · hh:mm A') : '—'

const SummaryCard = ({ title, value, suffix, helper, color = INK, icon }) => (
  <Card styles={{ body: { padding: 18 } }} style={{ borderColor: BORDER, height: '100%' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
      <Statistic
        title={<span style={{ color: MUTED, fontWeight: 700 }}>{title}</span>}
        value={Number(value || 0)}
        suffix={suffix}
        valueStyle={{ color, fontSize: 27, fontWeight: 750 }}
      />
      <div style={{ color, fontSize: 22 }}>{icon}</div>
    </div>
    <div style={{ color: MUTED, fontSize: 12, marginTop: 5 }}>{helper}</div>
  </Card>
)

const ProductName = ({ children }) => (
  <Text style={{ color: INK, fontSize: 16, lineHeight: 1.4, fontWeight: 750 }}>
    {children || '—'}
  </Text>
)

const statusTag = status => {
  if (status === 'ready_for_replay') return <Tag color='success'>Ready for replay</Tag>
  if (status === 'raw_issue_qty_gap') return <Tag color='error'>Issue quantity evidence missing</Tag>
  if (status === 'needs_raw_price_and_issue_qty') return <Tag color='error'>Price + issue quantity pending</Tag>
  if (status === 'issue_repair_staged') return <Tag color='processing'>Recovery staged</Tag>
  if (status === 'missing_raw_issue') return <Tag color='error'>Issue trail missing</Tag>
  return <Tag color='warning'>Raw pricing pending</Tag>
}

const exactResolutionTag = status => {
  if (status === 'staged_exact') return <Tag color='success'>Exact cost staged</Tag>
  if (status === 'evidence_ready') return <Tag color='cyan'>Evidence ready</Tag>
  if (status === 'lineage_blocked') return <Tag color='error'>Lineage blocked</Tag>
  return <Tag color='warning'>Exact evidence required</Tag>
}

const currentCostTag = classification => {
  if (classification === 'average') return <Tag color='gold'>Average—not exact</Tag>
  if (classification === 'pending') return <Tag color='error'>Pending</Tag>
  return <Tag color='success'>Exact</Tag>
}

const ProductionRawCostingPage = () => {
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState('exact')
  const [exactQueueFilter, setExactQueueFilter] = useState('needs_work')
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [data, setData] = useState({
    summary: emptySummary,
    pricingPlans: [],
    missingIssuePlans: [],
    exactOnly: { summary: emptyExactOnlySummary, sources: [] },
    stagedReplay: null,
    policy: null,
    window: null
  })
  const [draftCosts, setDraftCosts] = useState({})
  const [draftRepairCosts, setDraftRepairCosts] = useState({})
  const [savingSourceKey, setSavingSourceKey] = useState(null)
  const [savingRepairPlanId, setSavingRepairPlanId] = useState(null)
  const [savingImportedCosts, setSavingImportedCosts] = useState(false)

  const fetchWorkspace = useCallback(async () => {
    setLoading(true)
    setPreviewLoading(true)
    const previewPromise = client.get('/cost-management/step3/exact-only/replay-preview')
      .then(response => response.data || null)
      .catch(error => {
        console.error('Failed to compute staged exact replay preview:', error)
        return null
      })
    try {
      const response = await client.get('/cost-management/step3/production-costing')
      const payload = response.data || {}
      setData(previous => ({
        summary: payload.summary || emptySummary,
        pricingPlans: payload.pricingPlans || [],
        missingIssuePlans: payload.missingIssuePlans || [],
        exactOnly: {
          summary: payload.exactOnly?.summary || emptyExactOnlySummary,
          sources: payload.exactOnly?.sources || []
        },
        stagedReplay: previous.stagedReplay,
        policy: payload.policy || null,
        window: payload.window || null
      }))
      setDraftCosts(previous => {
        const next = { ...previous }
        const plansWithLayers = [
          ...(payload.pricingPlans || []),
          ...(payload.missingIssuePlans || []).map(plan => ({
            rawLayers: plan.parentRawLayers || []
          }))
        ]
        plansWithLayers.forEach(plan => {
          ;(plan.rawLayers || []).forEach(layer => {
            const startingCost = Number(
              layer.manualUnitCost ||
              layer.erpPurchaseFallback?.suggestedUnitCost ||
              layer.tallyFallback?.suggestedUnitCost
            )
            if (next[layer.sourceKey] === undefined && startingCost > 0) {
              next[layer.sourceKey] = startingCost
            }
          })
        })
        ;(payload.exactOnly?.sources || []).forEach(source => {
          const startingCost = Number(
            source.manualUnitCost ||
            source.erpPurchaseFallback?.suggestedUnitCost ||
            source.tallyFallback?.suggestedUnitCost
          )
          if (next[source.sourceKey] === undefined && startingCost > 0) {
            next[source.sourceKey] = startingCost
          }
        })
        return next
      })
      setDraftRepairCosts(previous => {
        const next = { ...previous }
        ;(payload.missingIssuePlans || [])
          .filter(plan => plan.exceptionType === 'direct_issue_gap')
          .forEach(plan => {
            if (next[plan.planId] !== undefined) return
            const startingCost = Number(
              plan.repair?.unitCost || plan.nearestErpInventoryIn?.suggestedUnitCost
            )
            if (startingCost > 0) next[plan.planId] = startingCost
          })
        return next
      })
      setLoading(false)
      const stagedReplay = await previewPromise
      if (stagedReplay) {
        setData(previous => ({ ...previous, stagedReplay }))
      }
    } catch (error) {
      console.error('Failed to load production raw-layer costing:', error)
      message.error(error.response?.data?.message || 'Failed to load Step 3 production costing')
    } finally {
      setLoading(false)
      setPreviewLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkspace()
  }, [fetchWorkspace])

  const approveLayer = useCallback(async layer => {
    if (layer.actionType === 'resolve_in_step1' || layer.sourceType === 'opening') {
      navigate('/costing/step-1-opening-stock')
      return
    }
    if (layer.actionType === 'repair_lineage' || layer.sourceType === 'synthetic') {
      message.warning('Correct the missing inventory or production lineage before assigning an exact cost')
      return
    }
    const importedCost = Number(layer.erpPurchaseFallback?.suggestedUnitCost)
    const unitCost = importedCost > 0
      ? importedCost
      : Number(draftCosts[layer.sourceKey])
    if (!(unitCost > 0)) {
      message.warning('Enter the GST-inclusive raw material cost per piece')
      return
    }
    setSavingSourceKey(layer.sourceKey)
    try {
      const response = await client.post(
        `/cost-management/step3/raw-layers/${layer.layerId}/approve`,
        importedCost > 0 ? {} : { unitCost }
      )
      message.success(response.data?.message || 'Raw source price approved')
      await fetchWorkspace()
    } catch (error) {
      console.error('Failed to approve raw-layer price:', error)
      message.error(error.response?.data?.message || 'Failed to approve raw-layer price')
    } finally {
      setSavingSourceKey(null)
    }
  }, [draftCosts, fetchWorkspace, navigate])

  const stageImportedCosts = useCallback(async () => {
    setSavingImportedCosts(true)
    try {
      const response = await client.post(
        '/cost-management/step3/raw-layers/stage-imported-purchases'
      )
      message.success(response.data?.message || 'Imported ERP purchase costs staged')
      await fetchWorkspace()
    } catch (error) {
      console.error('Failed to stage imported ERP purchase costs:', error)
      message.error(error.response?.data?.message || 'Failed to stage imported ERP purchase costs')
    } finally {
      setSavingImportedCosts(false)
    }
  }, [fetchWorkspace])

  const approveRepair = useCallback(async plan => {
    const unitCost = Number(draftRepairCosts[plan.planId])
    if (!(unitCost > 0)) {
      message.warning('Enter the GST-inclusive raw material cost per piece for this repair')
      return
    }
    setSavingRepairPlanId(plan.planId)
    try {
      const response = await client.post(
        `/cost-management/step3/missing-raw-issues/${plan.planId}/approve-repair`,
        { unitCost }
      )
      message.success(response.data?.message || 'Production issue recovery staged')
      await fetchWorkspace()
    } catch (error) {
      console.error('Failed to stage production issue recovery:', error)
      message.error(error.response?.data?.message || 'Failed to stage production issue recovery')
    } finally {
      setSavingRepairPlanId(null)
    }
  }, [draftRepairCosts, fetchWorkspace])

  const rawLayerColumns = useMemo(() => [
    {
      title: 'ERP raw source',
      key: 'source',
      width: 210,
      render: (_, layer) => (
        <Space direction='vertical' size={3}>
          <Text strong style={{ color: INK, fontSize: 14 }}>
            Movement #{layer.sourceId}
          </Text>
          <Text style={{ color: MUTED }}>{formatDateTime(layer.sourceDate)}</Text>
          <Space size={5} wrap>
            <Tag>{layer.sourceReferenceType}</Tag>
            <Tag color={layer.sourceReferenceType === 'sync' ? 'gold' : layer.sourceType === 'adjustment_in' ? 'purple' : 'blue'}>
              {layer.sourceReferenceType === 'sync'
                ? 'Opening snapshot source'
                : layer.sourceType === 'adjustment_in' ? 'Adjustment layer' : 'Inventory In layer'}
            </Tag>
          </Space>
        </Space>
      )
    },
    {
      title: 'Raw product',
      dataIndex: 'rawProductName',
      key: 'rawProductName',
      width: 310,
      render: (value, layer) => (
        <Space direction='vertical' size={3}>
          <ProductName>{value}</ProductName>
          <Text style={{ color: MUTED, fontSize: 12 }}>Product ID {layer.rawProductId}</Text>
          {layer.sharedPlanCount > 1 && (
            <Tag color='geekblue'>Shared by {layer.sharedPlanCount} plans</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Purchase pricing evidence',
      key: 'purchaseFallback',
      width: 520,
      render: (_, layer) => {
        const imported = layer.erpPurchaseFallback
        const fallback = layer.tallyFallback
        if (imported?.eligible) {
          return (
            <Space direction='vertical' size={7} style={{ width: '100%' }}>
              <Space size={5} wrap>
                <Tag color='green'>Imported ERP purchase data</Tag>
                <Tag color={imported.fullyCovered ? 'success' : 'error'}>
                  {formatQty(imported.matchedQty)} of {formatQty(imported.requiredQty)} matched
                </Tag>
                <Tag>Latest prior purchases only</Tag>
              </Space>
              {(imported.purchases || []).map(purchase => (
                <div
                  key={purchase.movementId}
                  style={{ borderLeft: `3px solid ${imported.pricingReady ? GREEN : ORANGE}`, paddingLeft: 9 }}
                >
                  <Text strong style={{ display: 'block', color: INK }}>
                    {formatDate(purchase.purchaseDate || purchase.movementAt)} · Invoice {purchase.invoiceNo || '—'} · Movement #{purchase.movementId}
                  </Text>
                  <Text style={{ display: 'block', color: INK, fontSize: 14, fontWeight: 650 }}>
                    {purchase.supplier || 'Approved imported purchase'}
                  </Text>
                  <Text style={{ color: MUTED, fontSize: 12 }}>
                    {formatQty(purchase.matchedQty)} matched from {formatQty(purchase.purchaseQuantity)}
                    {purchase.reservedQty > 0 ? ` · ${formatQty(purchase.reservedQty)} already allocated in Step 3` : ''}
                    {purchase.unitCost
                      ? ` · ${formatMoney(purchase.unitCost)} / Pc`
                      : ' · imported purchase price pending'}
                  </Text>
                </div>
              ))}
              {!(imported.purchases || []).length && (
                <Text style={{ color: '#b54708' }}>
                  No approved same-product ERP purchase existed before this production issue.
                </Text>
              )}
              {imported.remainingQty > 0 && (
                <Text type='danger'>
                  {formatQty(imported.remainingQty)} still lacks imported purchase quantity evidence
                </Text>
              )}
            </Space>
          )
        }
        if (!fallback?.eligible) {
          return <Text type='secondary'>No automatic purchase fallback applies</Text>
        }
        return (
          <Space direction='vertical' size={7} style={{ width: '100%' }}>
            <Space size={5} wrap>
              <Tag color='cyan'>Tally fallback</Tag>
              <Tag color={fallback.fullyCovered ? 'success' : 'error'}>
                {formatQty(fallback.matchedQty)} of {formatQty(fallback.requiredQty)} matched
              </Tag>
              <Tag>Purchases before 05 Jan 2026 only</Tag>
            </Space>
            {(fallback.purchases || []).map(purchase => (
              <div
                key={purchase.purchaseId}
                style={{ borderLeft: `3px solid ${fallback.pricingReady ? GREEN : ORANGE}`, paddingLeft: 9 }}
              >
                <Text strong style={{ display: 'block', color: INK }}>
                  {formatDate(purchase.purchaseDate)} · Voucher {purchase.voucherNumber || purchase.voucherId} · Line {purchase.inventoryLine}
                </Text>
                <Text style={{ display: 'block', color: INK, fontSize: 14, fontWeight: 650 }}>
                  {purchase.supplier} · {purchase.productName}
                </Text>
                <Text style={{ color: MUTED, fontSize: 12 }}>
                  {formatQty(purchase.matchedQty)} matched from {formatQty(purchase.purchaseQuantity)}
                  {purchase.reservedQty > 0 ? ` · ${formatQty(purchase.reservedQty)} already allocated` : ''}
                  {purchase.unitCost
                    ? ` · ${formatMoney(purchase.unitCost)} / Pc`
                    : ' · purchase-line price pending'}
                </Text>
              </div>
            ))}
            {!(fallback.purchases || []).length && (
              <Text style={{ color: '#b54708' }}>
                No unallocated matching non-Cash Tally purchase was found before 5 Jan 2026.
              </Text>
            )}
            {fallback.remainingQty > 0 && (
              <Text type='danger'>{formatQty(fallback.remainingQty)} still lacks Tally quantity evidence</Text>
            )}
          </Space>
        )
      }
    },
    {
      title: 'Layer Qty',
      key: 'layerQty',
      width: 130,
      render: (_, layer) => (
        <Space direction='vertical' size={2}>
          <Text strong>{formatQty(layer.layerQty)}</Text>
          <Text style={{ color: MUTED, fontSize: 12 }}>
            {formatQty(layer.layerRemainingQty)} remains
          </Text>
        </Space>
      )
    },
    {
      title: 'Used by source plan',
      key: 'usedQty',
      width: 155,
      render: (_, layer) => (
        <Space direction='vertical' size={2}>
          <Text strong style={{ color: ORANGE }}>{formatQty(layer.usedByPlanQty)}</Text>
          <Text style={{ color: MUTED, fontSize: 12 }}>
            {formatQty(layer.totalProductionUsedQty)} total production use
          </Text>
        </Space>
      )
    },
    {
      title: 'Pricing evidence',
      key: 'status',
      width: 180,
      render: (_, layer) => {
        if (layer.pricingStatus === 'already_priced') {
          return (
            <Space direction='vertical' size={3}>
              <Tag color='success'>Already priced</Tag>
              <Text strong>{formatMoney(layer.effectiveUnitCost)} / Pc</Text>
              <Text style={{ color: MUTED, fontSize: 12 }}>{layer.costSource}</Text>
            </Space>
          )
        }
        if (layer.pricingStatus === 'manually_approved') {
          const importedApproval = layer.pricingEvidence?.source === 'approved_exact_erp_purchase_import'
          return (
            <Space direction='vertical' size={3}>
              <Tag color={importedApproval ? 'green' : 'processing'}>
                {importedApproval ? 'Imported price staged' : 'Manual price staged'}
              </Tag>
              <Text strong>{formatMoney(layer.manualUnitCost)} / Pc</Text>
              <Text style={{ color: MUTED, fontSize: 12 }}>{formatDateTime(layer.approvedAt)}</Text>
            </Space>
          )
        }
        if (layer.erpPurchaseFallback?.pricingReady) {
          return (
            <Space direction='vertical' size={3}>
              <Tag color='green'>Imported purchase price ready</Tag>
              <Text strong>{formatMoney(layer.erpPurchaseFallback.suggestedUnitCost)} / Pc</Text>
              <Text style={{ color: MUTED, fontSize: 12 }}>
                Quantity-weighted from approved prior ERP purchases
              </Text>
            </Space>
          )
        }
        if (layer.tallyFallback?.pricingReady) {
          return (
            <Space direction='vertical' size={3}>
              <Tag color='cyan'>Tally price available</Tag>
              <Text strong>{formatMoney(layer.tallyFallback.suggestedUnitCost)} / Pc</Text>
              <Text style={{ color: MUTED, fontSize: 12 }}>
                Weighted from matched purchases before 5 Jan
              </Text>
            </Space>
          )
        }
        return <Tag color='warning'>Price required</Tag>
      }
    },
    {
      title: 'GST-inclusive raw cost / Pc',
      key: 'costInput',
      width: 230,
      render: (_, layer) => {
        if (layer.sourceType === 'opening') {
          return (
            <Space direction='vertical' size={3}>
              <Text strong>Complete exact opening allocation in Step 1</Text>
              <Text style={{ color: MUTED, fontSize: 11 }}>
                An opening average cannot be converted into exact evidence by entering a rate here.
              </Text>
            </Space>
          )
        }
        if (layer.sourceType === 'synthetic') {
          return <Text type='danger'>Restore the real inventory source first</Text>
        }
        if (layer.pricingStatus === 'already_priced') return <Text type='secondary'>No input needed</Text>
        if (layer.erpPurchaseFallback?.pricingReady) {
          return (
            <Space direction='vertical' size={3}>
              <Text strong style={{ color: GREEN, fontSize: 16 }}>
                {formatMoney(layer.erpPurchaseFallback.suggestedUnitCost)} / Pc
              </Text>
              <Text style={{ color: MUTED, fontSize: 11 }}>
                Locked to the approved imported purchase allocation · no data entry needed
              </Text>
            </Space>
          )
        }
        return (
          <Space direction='vertical' size={5} style={{ width: '100%' }}>
            <InputNumber
              value={draftCosts[layer.sourceKey]}
              onChange={value => setDraftCosts(previous => ({
                ...previous,
                [layer.sourceKey]: value
              }))}
              min={0.01}
              max={1000000}
              precision={2}
              step={100}
              prefix='₹'
              placeholder='Cost per piece'
              style={{ width: 190 }}
            />
            <Text style={{ color: MUTED, fontSize: 11 }}>
              {layer.tallyFallback?.pricingReady
                ? 'Prefilled from pre-5 Jan Tally evidence · editable before approval'
                : 'Material only · production expense excluded'}
            </Text>
          </Space>
        )
      }
    },
    {
      title: 'Approval',
      key: 'action',
      fixed: 'right',
      width: 145,
      render: (_, layer) => {
        if (layer.sourceType === 'opening') {
          return (
            <Button onClick={() => navigate('/costing/step-1-opening-stock')}>
              Open Step 1
            </Button>
          )
        }
        if (layer.sourceType === 'synthetic') return <Tag color='error'>Lineage required</Tag>
        if (layer.pricingStatus === 'already_priced') {
          return <CheckCircleOutlined style={{ color: GREEN, fontSize: 20 }} />
        }
        const saving = savingSourceKey === layer.sourceKey
        const importedReady = layer.erpPurchaseFallback?.pricingReady
        return (
          <Button
            type='primary'
            icon={<SaveOutlined />}
            loading={saving}
            disabled={saving || (!importedReady && !(Number(draftCosts[layer.sourceKey]) > 0))}
            onClick={() => approveLayer(layer)}
            style={{ background: ORANGE }}
          >
            {importedReady
              ? 'Stage imported'
              : layer.pricingStatus === 'manually_approved' ? 'Update' : 'Approve'}
          </Button>
        )
      }
    }
  ], [approveLayer, draftCosts, navigate, savingSourceKey])

  const exactSourceColumns = useMemo(() => [
    {
      title: 'Root source',
      key: 'source',
      width: 235,
      render: (_, source) => (
        <Space direction='vertical' size={4}>
          <Text strong style={{ color: INK, fontSize: 15 }}>
            {source.sourceType === 'opening'
              ? 'Opening stock residual'
              : source.sourceType === 'production_lineage'
                ? `Production plan #${source.sourceId}`
              : source.sourceType === 'synthetic'
                ? `Synthetic layer #${source.layerId}`
                : `Movement #${source.sourceId}`}
          </Text>
          <Text style={{ color: MUTED }}>{formatDateTime(source.sourceDate)}</Text>
          <Space size={4} wrap>
            <Tag>{source.sourceReferenceType}</Tag>
            {currentCostTag(source.currentClassification)}
          </Space>
        </Space>
      )
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      width: 330,
      render: (value, source) => (
        <Space direction='vertical' size={4}>
          <ProductName>{value}</ProductName>
          <Text style={{ color: MUTED, fontSize: 12 }}>Product ID {source.productId}</Text>
          {source.productionPlanIds?.length > 0 && (
            <Text style={{ color: MUTED, fontSize: 12 }}>
              Plans {source.productionPlanIds.slice(0, 8).map(id => `#${id}`).join(', ')}
              {source.productionPlanIds.length > 8 ? ` +${source.productionPlanIds.length - 8} more` : ''}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'July sales impact',
      key: 'impact',
      width: 210,
      sorter: (left, right) => left.impactedSaleQty - right.impactedSaleQty,
      defaultSortOrder: 'descend',
      render: (_, source) => (
        <Space direction='vertical' size={3}>
          <Text strong style={{ color: '#d92d20', fontSize: 17 }}>
            {formatQty(source.impactedSaleQty)}
          </Text>
          <Text style={{ color: MUTED, fontSize: 12 }}>
            {source.affectedSales} sale{source.affectedSales === 1 ? '' : 's'} · {source.affectedProductionPlans} production plan{source.affectedProductionPlans === 1 ? '' : 's'}
          </Text>
          {source.directSaleQty > 0 && (
            <Tag color='blue'>{formatQty(source.directSaleQty)} direct stock</Tag>
          )}
          {source.productionSaleQty > 0 && (
            <Tag color='purple'>{formatQty(source.productionSaleQty)} through production</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Quantity evidence',
      key: 'quantity',
      width: 205,
      render: (_, source) => (
        <Space direction='vertical' size={3}>
          <Text strong>{formatQty(source.sourceMovementQty || source.sourceLayerQty)}</Text>
          <Text style={{ color: MUTED, fontSize: 12 }}>
            {source.sourceMovementQty > 0 ? 'ERP Inventory In quantity' : 'FIFO source quantity'}
          </Text>
          {source.usedByProductionQty > 0 && (
            <Text style={{ color: MUTED, fontSize: 12 }}>
              {formatQty(source.usedByProductionQty)} issued to affected plans
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Evidence status',
      key: 'evidence',
      width: 290,
      render: (_, source) => (
        <Space direction='vertical' size={5} style={{ width: '100%' }}>
          {exactResolutionTag(source.resolutionStatus)}
          {source.resolutionStatus === 'staged_exact' && (
            <>
              {source.sourceType === 'opening' ? (
                <Text strong style={{ color: GREEN }}>
                  {formatQty(source.openingCoverage?.approvedQty)} approved against {formatQty(source.openingCoverage?.snapshotQty)} opening stock
                </Text>
              ) : (
                <Text strong style={{ color: GREEN }}>
                  {formatMoney(source.manualUnitCost)} / Pc
                </Text>
              )}
              <Text style={{ color: MUTED, fontSize: 12 }}>
                Will become exact after controlled replay
              </Text>
            </>
          )}
          {source.erpPurchaseFallback?.eligible && (
            <Text style={{ color: MUTED, fontSize: 12 }}>
              ERP purchase match: {formatQty(source.erpPurchaseFallback.matchedQty)} of {formatQty(source.erpPurchaseFallback.requiredQty)}
            </Text>
          )}
          {source.tallyFallback?.eligible && (
            <Text style={{ color: MUTED, fontSize: 12 }}>
              Pre-5 Jan Tally match: {formatQty(source.tallyFallback.matchedQty)} of {formatQty(source.tallyFallback.requiredQty)}
            </Text>
          )}
          {source.actionType === 'resolve_in_step1' && (
            <Space direction='vertical' size={2}>
              <Text style={{ color: '#b54708', fontSize: 12 }}>
                Allocate exact invoice-backed opening purchase lines in Step 1.
              </Text>
              {source.openingCoverage && (
                <Text style={{ color: MUTED, fontSize: 12 }}>
                  {formatQty(source.openingCoverage.approvedQty)} approved of {formatQty(source.openingCoverage.snapshotQty)} · {formatQty(source.openingCoverage.remainingQty)} remaining
                </Text>
              )}
            </Space>
          )}
          {source.actionType === 'repair_lineage' && (
            <Text type='danger' style={{ fontSize: 12 }}>
              A rate alone cannot make this exact. Restore the real Inventory In or production issue source.
            </Text>
          )}
          {source.currentUnitCost > 0 && source.resolutionStatus !== 'staged_exact' && (
            <Text style={{ color: MUTED, fontSize: 12 }}>
              Current {source.currentClassification}: {formatMoney(source.currentUnitCost)} / Pc
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Exact GST-inclusive cost / Pc',
      key: 'cost',
      width: 250,
      render: (_, source) => {
        if (source.actionType === 'resolve_in_step1') {
          return <Text type='secondary'>Calculated from Step 1 purchase-line taxable amount + approved GST</Text>
        }
        if (source.actionType === 'repair_lineage') {
          return <Text type='danger'>Not editable until lineage exists</Text>
        }
        const importedCost = Number(source.erpPurchaseFallback?.suggestedUnitCost)
        if (importedCost > 0) {
          return (
            <Space direction='vertical' size={3}>
              <Text strong style={{ color: GREEN, fontSize: 16 }}>{formatMoney(importedCost)} / Pc</Text>
              <Text style={{ color: MUTED, fontSize: 11 }}>Locked to approved ERP purchase evidence</Text>
            </Space>
          )
        }
        return (
          <Space direction='vertical' size={4}>
            <InputNumber
              value={draftCosts[source.sourceKey]}
              onChange={value => setDraftCosts(previous => ({
                ...previous,
                [source.sourceKey]: value
              }))}
              min={0.01}
              max={1000000}
              precision={2}
              step={100}
              prefix='₹'
              placeholder='Exact cost per piece'
              style={{ width: 205 }}
            />
            <Text style={{ color: MUTED, fontSize: 11 }}>
              Use the source purchase-line taxable amount + final GST ÷ purchase-line quantity.
            </Text>
          </Space>
        )
      }
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 155,
      render: (_, source) => {
        if (source.actionType === 'resolve_in_step1') {
          if (source.resolutionStatus === 'staged_exact') {
            return <Tag icon={<CheckCircleOutlined />} color='success'>Opening ready</Tag>
          }
          return <Button onClick={() => navigate('/costing/step-1-opening-stock')}>Open Step 1</Button>
        }
        if (source.actionType === 'repair_lineage') {
          return source.productionPlanIds?.length
            ? <Button danger onClick={() => setWorkspace('issues')}>Open exceptions</Button>
            : <Tag color='error'>Source correction</Tag>
        }
        const importedReady = Number(source.erpPurchaseFallback?.suggestedUnitCost) > 0
        const saving = savingSourceKey === source.sourceKey
        return (
          <Button
            type='primary'
            icon={<SaveOutlined />}
            loading={saving}
            disabled={saving || (!importedReady && !(Number(draftCosts[source.sourceKey]) > 0))}
            onClick={() => approveLayer(source)}
            style={{ background: source.resolutionStatus === 'staged_exact' ? GREEN : ORANGE }}
          >
            {source.resolutionStatus === 'staged_exact'
              ? 'Update'
              : importedReady ? 'Stage exact' : 'Approve exact'}
          </Button>
        )
      }
    }
  ], [approveLayer, draftCosts, navigate, savingSourceKey])

  const planColumns = useMemo(() => [
    {
      title: 'Production plan',
      key: 'plan',
      width: 170,
      render: (_, plan) => (
        <Space direction='vertical' size={3}>
          <Text strong style={{ color: INK, fontSize: 16 }}>Plan #{plan.planId}</Text>
          <Text style={{ color: MUTED }}>{formatDateTime(plan.firstOutputAt)}</Text>
          {statusTag(plan.status)}
        </Space>
      )
    },
    {
      title: 'Raw → Finished lineage',
      key: 'lineage',
      width: 430,
      render: (_, plan) => (
        <Space direction='vertical' size={8}>
          <div>
            <Text style={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Raw issued</Text>
            <div><ProductName>{plan.rawProductName}</ProductName></div>
          </div>
          <div style={{ color: ORANGE, fontWeight: 800 }}>↓ same material cost per piece</div>
          <div>
            <Text style={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Finished output</Text>
            <div><ProductName>{plan.finishedProductName}</ProductName></div>
          </div>
        </Space>
      )
    },
    {
      title: 'Output affected',
      key: 'output',
      width: 170,
      render: (_, plan) => (
        <Space direction='vertical' size={3}>
          <Text strong>{formatQty(plan.completedQty)} completed</Text>
          {plan.outputQty !== plan.completedQty && (
            <Text style={{ color: MUTED, fontSize: 12 }}>
              {formatQty(plan.outputQty)} in current FIFO output evidence
            </Text>
          )}
          <Text style={{ color: MUTED }}>{formatQty(plan.pendingSoldQty)} in July sales</Text>
          <Text style={{ color: MUTED }}>{plan.affectedSales} sale{plan.affectedSales === 1 ? '' : 's'}</Text>
        </Space>
      )
    },
    {
      title: 'Raw pricing coverage',
      key: 'coverage',
      width: 230,
      render: (_, plan) => {
        const percent = plan.rawIssueQty > 0
          ? Math.round((plan.pricedRawQty / plan.rawIssueQty) * 100)
          : 0
        return (
          <Space direction='vertical' size={5} style={{ width: '100%' }}>
            <Progress
              percent={percent}
              size='small'
              status={percent === 100 ? 'success' : 'active'}
              strokeColor={percent === 100 ? GREEN : ORANGE}
            />
            <Text>{formatQty(plan.pricedRawQty)} priced of {formatQty(plan.rawIssueQty)}</Text>
            <Text style={{ color: MUTED, fontSize: 12 }}>
              {plan.rawLayers.length} raw layer{plan.rawLayers.length === 1 ? '' : 's'}
            </Text>
            {plan.rawIssueGapQty > 0 && (
              <Tag color='error'>
                {formatQty(plan.rawIssueGapQty)} issue gap · {formatQty(plan.rawIssueQty)} issued vs {formatQty(plan.requiredRawIssueQty)} required
              </Tag>
            )}
          </Space>
        )
      }
    },
    {
      title: 'Finished material cost / Pc',
      key: 'projectedCost',
      width: 195,
      render: (_, plan) => plan.projectedFinishedUnitCost
        ? (
            <Space direction='vertical' size={3}>
              <Text strong style={{ color: GREEN, fontSize: 17 }}>
                {formatMoney(plan.projectedFinishedUnitCost)}
              </Text>
              <Text style={{ color: MUTED, fontSize: 12 }}>ready after replay</Text>
            </Space>
          )
        : (
            <Text type='secondary'>
              {plan.rawIssueGapQty > 0
                ? `Resolve the ${formatQty(plan.rawIssueGapQty)} issue evidence gap`
                : 'Complete raw prices first'}
            </Text>
          )
    }
  ], [])

  const missingIssueColumns = useMemo(() => [
    {
      title: 'Production plan',
      key: 'plan',
      width: 170,
      render: (_, plan) => (
        <Space direction='vertical' size={3}>
          <Text strong style={{ color: INK, fontSize: 16 }}>Plan #{plan.planId}</Text>
          <Text style={{ color: MUTED }}>{formatDateTime(plan.firstOutputAt)}</Text>
          {plan.exceptionType === 'rework_parent_wip'
            ? <Tag color='purple'>Rework lineage</Tag>
            : plan.repair
              ? <Tag color='processing'>Issue recovery staged</Tag>
              : <Tag color='error'>Direct issue missing</Tag>}
        </Space>
      )
    },
    {
      title: 'Material source',
      key: 'rawProductName',
      width: 330,
      render: (_, plan) => (
        <Space direction='vertical' size={3}>
          <ProductName>
            {plan.exceptionType === 'rework_parent_wip'
              ? plan.parentRawProductName
              : plan.rawProductName}
          </ProductName>
          {plan.exceptionType === 'rework_parent_wip' && (
            <Text style={{ color: MUTED }}>From parent plan #{plan.parentPlanId} WIP</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Finished output',
      key: 'finished',
      width: 350,
      render: (_, plan) => (
        <Space direction='vertical' size={3}>
          <ProductName>{plan.finishedProductName}</ProductName>
          <Text style={{ color: MUTED }}>
            {formatQty(plan.completedQty)} net completed · movement{plan.outputSourceIds.length === 1 ? '' : 's'} {plan.outputSourceIds.map(id => `#${id}`).join(', ')}
          </Text>
        </Space>
      )
    },
    {
      title: 'What is missing',
      key: 'missing',
      width: 250,
      render: (_, plan) => (
        <Space direction='vertical' size={3}>
          <Text strong>
            {plan.exceptionType === 'rework_parent_wip'
              ? 'No direct issue is expected for rework'
              : plan.missingReason === 'request_without_inventory_out'
                ? 'Request exists, inventory-out is absent'
                : 'No inventory request or inventory-out'}
          </Text>
          <Text style={{ color: MUTED }}>
            {plan.exceptionType === 'rework_parent_wip'
              ? `Parent plan #${plan.parentPlanId} must fund the child WIP`
              : plan.requestCount > 0
                ? `${plan.requestCount} request · ${formatQty(plan.receivedQty)} marked received`
                : 'Production plan and accepted output are present'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Quantity recovery',
      key: 'recovery',
      width: 240,
      render: (_, plan) => (
        <Space direction='vertical' size={3}>
          <Text strong>
            {plan.exceptionType === 'rework_parent_wip'
              ? `Transfer material cost from parent #${plan.parentPlanId}`
              : `${formatQty(plan.suggestedIssueQty)} raw FIFO → WIP`}
          </Text>
          {plan.exceptionType === 'rework_parent_wip' ? (
            <Text style={{ color: MUTED, fontSize: 12 }}>
              {plan.parentRepair
                ? `${formatQty(plan.parentRepair.approvedQuantity)} parent issue recovery staged${plan.parentRepair.pricingReady ? ' and priced' : '; price pending'}`
                : `${formatQty(plan.parentPendingRawQty)} of parent raw WIP still needs pricing`}
            </Text>
          ) : (
            <Space direction='vertical' size={2}>
              <Text style={{ color: MUTED, fontSize: 12 }}>
                Uses inventory-request received quantity at {formatDateTime(plan.suggestedIssueAt)}
              </Text>
              {plan.repair && <Tag color='processing'>Quantity staged</Tag>}
            </Space>
          )}
          <Text style={{ color: MUTED, fontSize: 12 }}>
            Conversion cost ₹0/Pc
          </Text>
        </Space>
      )
    },
    {
      title: 'GST-inclusive raw cost / Pc',
      key: 'repairCost',
      width: 285,
      render: (_, plan) => {
        if (plan.exceptionType === 'rework_parent_wip') {
          if (plan.parentRepair?.pricingReady) {
            return (
              <Space direction='vertical' size={3}>
                <Text strong style={{ color: GREEN, fontSize: 16 }}>
                  {formatMoney(plan.parentRepair.unitCost)} / Pc
                </Text>
                <Text style={{ color: MUTED, fontSize: 12 }}>
                  Carried from parent plan #{plan.parentPlanId}
                </Text>
              </Space>
            )
          }
          return (
            <Space direction='vertical' size={3}>
              <Text strong>
                {plan.parentRepair
                  ? `Price parent repair #${plan.parentPlanId}`
                  : 'Price the parent raw layers below'}
              </Text>
              <Text style={{ color: MUTED, fontSize: 12 }}>
                No second raw issue is created for this rework plan.
              </Text>
            </Space>
          )
        }

        const nearest = plan.nearestErpInventoryIn
        return (
          <Space direction='vertical' size={5} style={{ width: '100%' }}>
            <InputNumber
              value={draftRepairCosts[plan.planId]}
              onChange={value => setDraftRepairCosts(previous => ({
                ...previous,
                [plan.planId]: value
              }))}
              min={0.01}
              max={1000000}
              precision={2}
              step={100}
              prefix='₹'
              placeholder='Raw cost per piece'
              style={{ width: 210 }}
            />
            {nearest ? (
              <>
                <Text style={{ color: MUTED, fontSize: 12 }}>
                  Nearest ERP Inventory In #{nearest.movementId}: {formatQty(nearest.quantity)} on {formatDate(nearest.movementAt)}
                </Text>
                <Text style={{ color: nearest.isReferenceOnly ? '#b54708' : MUTED, fontSize: 11 }}>
                  {nearest.isReferenceOnly
                    ? `${nearest.distanceDays} days after the issue · reference price only`
                    : `${nearest.distanceDays} days before the issue`}
                  {nearest.suggestionSource ? ` · ${nearest.suggestionSource}` : ''}
                </Text>
              </>
            ) : (
              <Text style={{ color: '#b54708', fontSize: 12 }}>
                No eligible ERP purchase/adjustment Inventory In exists for this raw product; enter the evidenced material price manually.
              </Text>
            )}
          </Space>
        )
      }
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 155,
      render: (_, plan) => plan.exceptionType === 'rework_parent_wip'
        ? plan.status === 'rework_lineage_ready'
          ? <Tag icon={<CheckCircleOutlined />} color='success'>Lineage ready</Tag>
          : <Tag color='warning'>Price parent layers</Tag>
        : plan.repairPricingReady
          ? <Tag icon={<CheckCircleOutlined />} color='success'>Repair ready</Tag>
          : (
            <Button
              type='primary'
              icon={<SafetyCertificateOutlined />}
              loading={savingRepairPlanId === plan.planId}
              disabled={!(Number(draftRepairCosts[plan.planId]) > 0)}
              onClick={() => approveRepair(plan)}
              style={{ background: ORANGE }}
            >
              {plan.repair ? 'Approve cost' : 'Stage + approve'}
            </Button>
            )
    }
  ], [approveRepair, draftRepairCosts, savingRepairPlanId])

  const summary = data.summary || emptySummary
  const exactSummary = data.exactOnly?.summary || emptyExactOnlySummary
  const exactSources = data.exactOnly?.sources || []
  const stagedReplay = data.stagedReplay
  const stagedTotals = stagedReplay?.totals
  const filteredExactSources = exactQueueFilter === 'all'
    ? exactSources
    : exactSources.filter(source => source.resolutionStatus !== 'staged_exact')

  return (
    <div style={{ padding: '0 4px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
        <div>
          <PageTitle>Step 3 · Production Costing</PageTitle>
          <Text style={{ color: MUTED, fontSize: 14 }}>
            Replace every average and pending July sale layer with exact source evidence.
          </Text>
        </div>
        <Space wrap>
          <Button
            type='primary'
            icon={<SafetyCertificateOutlined />}
            loading={savingImportedCosts}
            disabled={savingImportedCosts || summary.importedPurchasePricingReadyLayers <= 0}
            onClick={stageImportedCosts}
            style={{ background: GREEN }}
          >
            Stage {summary.importedPurchasePricingReadyLayers} imported costs
          </Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchWorkspace}>
            Refresh
          </Button>
        </Space>
      </div>

      <Alert
        type='info'
        showIcon
        icon={<SafetyCertificateOutlined />}
        message='Strict exact-only material policy'
        description='Average rates, static fallbacks and synthetic prices do not count as exact. A finished wheel inherits the exact per-piece material cost carried by its raw FIFO source; production overhead remains a monthly expense. Source approvals are staged safely and do not change FIFO stock or sales until the controlled chronological replay.'
        style={{ marginBottom: 18 }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
        <SummaryCard
          title='Exact July coverage'
          value={exactSummary.currentExactPercent}
          suffix='%'
          helper={`${formatQty(exactSummary.currentExactPieces)} of ${formatQty(exactSummary.salesPieces)} are exact in the live ledger`}
          color={GREEN}
          icon={<SafetyCertificateOutlined />}
        />
        <SummaryCard
          title='Exact using staged'
          value={stagedTotals?.exactPercent || 0}
          suffix='%'
          helper={previewLoading
            ? 'Running the chronological exact-only replay…'
            : stagedTotals
              ? `${formatQty(stagedTotals.exactPieces)} become exact using staged evidence`
              : 'Staged replay preview unavailable'}
          color={GREEN}
          icon={<ClockCircleOutlined />}
        />
        <SummaryCard
          title='Pending after staged replay'
          value={stagedTotals?.pendingPieces ?? exactSummary.nonExactPieces}
          suffix='Pcs'
          helper={stagedReplay
            ? `${formatQty(stagedReplay.pendingBySourceType?.production_output)} production · ${formatQty(stagedReplay.pendingBySourceType?.purchase_movement)} purchase · ${formatQty(stagedReplay.pendingBySourceType?.opening)} opening`
            : `${formatQty(exactSummary.currentAveragePieces)} average · ${formatQty(exactSummary.currentPendingPieces)} pending now`}
          color='#d92d20'
          icon={<WarningOutlined />}
        />
        <SummaryCard
          title='Source rows still open'
          value={exactSummary.openSources}
          helper={`${exactSummary.unresolvedSources} need evidence · ${exactSummary.evidenceReadySources} ready to approve · ${exactSummary.stagedSources} staged`}
          color='#175cd3'
          icon={<ApartmentOutlined />}
        />
      </div>

      <Card styles={{ body: { padding: 16 } }} style={{ borderColor: BORDER }}>
        <Segmented
          value={workspace}
          onChange={setWorkspace}
          options={[
            {
              value: 'exact',
              label: `Exact-only Gaps (${exactSummary.openSources})`
            },
            {
              value: 'pricing',
              label: `Raw Layer Pricing (${summary.pricingPlans})`
            },
            {
              value: 'issues',
              label: `Lineage Exceptions (${summary.missingIssuePlans})`
            }
          ]}
          style={{ marginBottom: 18 }}
        />

        {workspace === 'exact' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <Title level={4} style={{ margin: 0, color: INK }}>
                  Deduplicated exact-source queue
                </Title>
                <Text style={{ color: MUTED }}>
                  One row represents one root acquisition source. Shared sources are approved once and then reused by every dependent production plan and sale.
                </Text>
              </div>
              <Segmented
                value={exactQueueFilter}
                onChange={setExactQueueFilter}
                options={[
                  { value: 'needs_work', label: `Needs work (${exactSummary.openSources})` },
                  { value: 'all', label: `All (${exactSummary.sources})` }
                ]}
              />
            </div>
            <Alert
              type={stagedReplay?.readyToApply ? 'success' : 'warning'}
              showIcon
              message={stagedTotals
                ? `${formatQty(stagedTotals.exactPieces)} of ${formatQty(stagedTotals.salesPieces)} are exact when staged approvals are used`
                : `${formatQty(exactSummary.nonExactPieces)} are not exact in the live July ledger`}
              description={stagedTotals
                ? `${formatQty(stagedTotals.pendingPieces)} remain pending, so the replay is compute-only and cannot be committed. No average rate is used. ${formatQty(stagedReplay.pendingBySourceType?.synthetic)} remain synthetic and require source correction.`
                : 'Calculating the authoritative staged replay. Opening averages must be completed in Step 1; synthetic rows require their real inventory or production source before replay.'}
              style={{ marginBottom: 16 }}
            />
            <Progress
              percent={stagedTotals?.exactPercent ?? exactSummary.currentExactPercent}
              success={{ percent: stagedTotals?.exactPercent ?? exactSummary.currentExactPercent }}
              strokeColor={GREEN}
              format={percent => `${percent}% exact using staged`}
              style={{ marginBottom: 18 }}
            />
            <Table
              rowKey='sourceKey'
              loading={loading}
              dataSource={filteredExactSources}
              columns={exactSourceColumns}
              pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: [25, 50, 100] }}
              scroll={{ x: 1680 }}
              locale={{ emptyText: <Empty description='Every July sale source is exact' /> }}
            />
          </>
        ) : workspace === 'pricing' ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0, color: INK }}>
                Production plans with raw-layer pricing gaps
              </Title>
              <Text style={{ color: MUTED }}>
                Expand a plan to audit its raw-source evidence. Imported April–June ERP purchases are picked up automatically and can be staged together with the green button above; manual entry remains only for sources the imported data cannot fully cover. A shared source is approved once and reused by every plan that consumed it. Quantity evidence remains separate: {summary.partialIssueGapPlans} plan is flagged for a {formatQty(summary.partialIssueGapQty)} issue gap.
              </Text>
            </div>
            <Table
              rowKey='planId'
              loading={loading}
              dataSource={data.pricingPlans}
              columns={planColumns}
              pagination={false}
              scroll={{ x: 1200 }}
              expandable={{
                expandedRowRender: plan => (
                  <div style={{ padding: '8px 4px 16px' }}>
                    <Table
                      rowKey={layer => `${plan.planId}-${layer.sourceKey}`}
                      dataSource={plan.rawLayers}
                      columns={rawLayerColumns}
                      pagination={false}
                      size='middle'
                      scroll={{ x: 1780 }}
                      locale={{ emptyText: <Empty description='No raw issue layers found' /> }}
                    />
                  </div>
                ),
                rowExpandable: plan => plan.rawLayers.length > 0
              }}
              locale={{ emptyText: <Empty description='No production plans need raw-layer pricing in this window' /> }}
            />
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div>
                <Title level={4} style={{ margin: 0, color: INK }}>
                  Direct issue gaps and rework parent lineage
                </Title>
                <Text style={{ color: MUTED }}>
                  {summary.directIssueGapPlans} direct plans have received inventory requests but no inventory-out movement. {summary.reworkLineagePlans} are rework plans and must inherit parent WIP cost—issuing raw stock again would double-count inventory.
                </Text>
              </div>
            </div>
            <Alert
              type='warning'
              showIcon
              message='Two different recovery rules are enforced'
              description={`Direct repairs use the ERP request-received quantity and are ignored if a genuine issue movement is restored; ${summary.directIssuePricesNeeded} direct repair prices still need approval. Rework plans transfer parent WIP only; ${summary.reworkRawLayersNeedingPrice} distinct parent raw layers still need pricing, and ${summary.reworkRawLayersSharedWithPricing} of those are shared with the 16-plan pricing queue.`}
              style={{ marginBottom: 16 }}
            />
            <Table
              rowKey='planId'
              loading={loading}
              dataSource={data.missingIssuePlans}
              columns={missingIssueColumns}
              pagination={false}
              scroll={{ x: 1750 }}
              expandable={{
                expandedRowRender: plan => (
                  <div style={{ padding: '8px 4px 16px' }}>
                    <Text strong style={{ display: 'block', marginBottom: 10 }}>
                      Parent plan #{plan.parentPlanId} raw FIFO layers
                    </Text>
                    <Table
                      rowKey={layer => `${plan.planId}-${layer.sourceKey}`}
                      dataSource={plan.parentRawLayers || []}
                      columns={rawLayerColumns}
                      pagination={false}
                      size='middle'
                      scroll={{ x: 1780 }}
                    />
                  </div>
                ),
                rowExpandable: plan => plan.exceptionType === 'rework_parent_wip' &&
                  (plan.parentRawLayers || []).length > 0
              }}
              locale={{ emptyText: <Empty description='No production plans are missing a raw issue trail' /> }}
            />
          </>
        )}
      </Card>
    </div>
  )
}

export default ProductionRawCostingPage
