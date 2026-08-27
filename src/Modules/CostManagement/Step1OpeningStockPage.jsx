import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  InputNumber,
  Modal,
  Progress,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message
} from 'antd'
import {
  ApartmentOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined,
  OrderedListOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  SearchOutlined,
  SwapOutlined,
  SyncOutlined,
  WarningOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

import PageTitle from '../../Core/Components/PageTitle'
import { client } from '../../Utils/axiosClient'
import {
  calculatePurchaseLineCosting,
  DEFAULT_ALLOY_GST_PERCENT,
  roundCurrency
} from '../../Utils/voucherCosting'

const { Text, Title } = Typography
const PAGE_SIZE = 40
const MATCH_PAGE_SIZE = 50
const SYNC_PAGE_SIZE = 50
const BORDER = '#e5e7eb'
const MUTED = '#667085'
const INK = '#182230'
const ORANGE = '#f26c2d'
const GST_PERCENT_OPTIONS = [18, 28].map(value => ({ value, label: `${value}%` }))

const emptySummary = {
  totalProducts: 0,
  totalQty: 0,
  rawProducts: 0,
  rawQty: 0,
  finishedProducts: 0,
  finishedQty: 0,
  readyProducts: 0,
  partialProducts: 0,
  notStartedProducts: 0,
  quantityMismatchProducts: 0,
  stagedQty: 0,
  outstandingQty: 0,
  currentPendingQty: 0,
  syncInQty: 0,
  syncOutQty: 0
}

const emptySyncSummary = {
  totalMovements: 0,
  inMovements: 0,
  inQty: 0,
  outMovements: 0,
  outQty: 0,
  snapshotMirrors: 0,
  openingReview: 0,
  countGains: 0,
  countLosses: 0
}

const emptyMatchedSummary = {
  totalMatchedLines: 0,
  totalMatchedQty: 0,
  rawMatchedLines: 0,
  rawMatchedQty: 0,
  finishedMatchedLines: 0,
  finishedMatchedQty: 0,
  distinctVouchers: 0,
  distinctOpeningProducts: 0,
  outstandingOpeningQty: 0,
  unresolvedLineageQty: 0,
  unmatchedPurchaseQty: 0,
  totalUnresolvedQty: 0
}

const formatQty = value => `${Number(value || 0).toLocaleString('en-IN')} Pcs`
const formatMoney = value => Number(value || 0).toLocaleString('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
})
const formatDate = value => value ? dayjs(value).format('DD MMM YYYY') : '—'
const formatDateTime = value => value ? dayjs(value).format('DD MMM YYYY · hh:mm A') : '—'
const normalizeGstPercent = value => {
  if (value === null || value === undefined || value === '') return DEFAULT_ALLOY_GST_PERCENT
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_ALLOY_GST_PERCENT
}

const sourceLabels = {
  'tally-xml-archive': 'Tally XML archive',
  purchases: 'Operational purchases',
  mixed: 'Mixed sources',
  none: 'No source found'
}

const purchaseLineRows = purchases => (purchases || []).map(purchase => ({
  ...purchase,
  matchedQty: Number(purchase.matchedQty) || 0,
  purchaseQuantity: Number(purchase.purchaseQuantity) || Number(purchase.originalQty) || 0
}))

const PURCHASE_PRICING_COLUMN_KEYS = new Set([
  'taxableAmount',
  'gstAmount',
  'gstInclusiveAmount',
  'inclusiveTotal',
  'unitCost'
])

const placePurchasePricingAfterQuantity = columns => {
  const columnKey = column => column.key || column.dataIndex
  const pricingColumns = columns.filter(column => PURCHASE_PRICING_COLUMN_KEYS.has(columnKey(column)))
  const remainingColumns = columns.filter(column => !PURCHASE_PRICING_COLUMN_KEYS.has(columnKey(column)))
  const quantityIndex = remainingColumns.findIndex(column => columnKey(column) === 'purchaseQuantity')

  if (quantityIndex < 0 || pricingColumns.length === 0) return columns

  return [
    ...remainingColumns.slice(0, quantityIndex + 1),
    ...pricingColumns,
    ...remainingColumns.slice(quantityIndex + 1)
  ]
}

const initialPurchaseCosts = purchases => {
  const values = {}
  purchaseLineRows(purchases).forEach(purchase => {
    const taxableAmount = purchase.inputTaxableAmount ?? ''
    const gstPercent = normalizeGstPercent(purchase.inputGstPercent)
    const automaticGst = Number(taxableAmount) > 0
      ? roundCurrency(Number(taxableAmount) * gstPercent / 100)
      : ''
    values[purchase.purchaseId] = {
      taxableAmount,
      gstPercent,
      gstAmount: purchase.inputGstAmount ?? automaticGst,
      gstManual: Boolean(purchase.inputGstOverridden)
    }
  })
  return values
}

const statusMeta = {
  ready: { color: 'success', label: 'Ready for replay', icon: <CheckCircleOutlined /> },
  partial: { color: 'warning', label: 'Partially staged', icon: <WarningOutlined /> },
  not_started: { color: 'default', label: 'Not started', icon: <ClockCircleOutlined /> }
}

const syncStatusMeta = {
  snapshot_mirror: {
    color: 'success',
    label: 'Opening snapshot mirror',
    icon: <CheckCircleOutlined />
  },
  opening_review: {
    color: 'warning',
    label: 'Same-day review',
    icon: <WarningOutlined />
  },
  count_gain: {
    color: 'blue',
    label: 'Count gain cost required',
    icon: <InboxOutlined />
  },
  count_loss: {
    color: 'volcano',
    label: 'FIFO variance',
    icon: <SwapOutlined />
  },
  no_cost_event: {
    color: 'default',
    label: 'No cost event',
    icon: <ClockCircleOutlined />
  }
}

const KpiCard = ({ title, value, suffix, helper, color = INK, icon }) => (
  <Card styles={{ body: { padding: 18 } }} style={{ borderRadius: 16, borderColor: BORDER, height: '100%' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: MUTED, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </div>
        <div style={{ color, fontSize: 27, lineHeight: 1.25, fontWeight: 750, marginTop: 5 }}>
          {Number(value || 0).toLocaleString('en-IN')}
          {suffix && <span style={{ color: MUTED, fontSize: 13, fontWeight: 500, marginLeft: 6 }}>{suffix}</span>}
        </div>
        <div style={{ color: MUTED, fontSize: 12, marginTop: 5 }}>{helper}</div>
      </div>
      <div style={{ color, fontSize: 22 }}>{icon}</div>
    </div>
  </Card>
)

const Step1OpeningStockPage = () => {
  const [workspace, setWorkspace] = useState('opening')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [policy, setPolicy] = useState(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [finishType, setFinishType] = useState('all')
  const [status, setStatus] = useState('all')
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [matchedLoading, setMatchedLoading] = useState(false)
  const [matchedRows, setMatchedRows] = useState([])
  const [matchedSummary, setMatchedSummary] = useState(emptyMatchedSummary)
  const [matchedPage, setMatchedPage] = useState(1)
  const [matchedTotalCount, setMatchedTotalCount] = useState(0)
  const [matchedFinishType, setMatchedFinishType] = useState('all')
  const [matchedSearchDraft, setMatchedSearchDraft] = useState('')
  const [matchedSearch, setMatchedSearch] = useState('')
  const [matchedPurchaseCosts, setMatchedPurchaseCosts] = useState({})
  const [matchedSavingId, setMatchedSavingId] = useState(null)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncRows, setSyncRows] = useState([])
  const [syncSummary, setSyncSummary] = useState(emptySyncSummary)
  const [syncPage, setSyncPage] = useState(1)
  const [syncTotalCount, setSyncTotalCount] = useState(0)
  const [syncFinishType, setSyncFinishType] = useState('all')
  const [syncStatus, setSyncStatus] = useState('all')
  const [syncSearchDraft, setSyncSearchDraft] = useState('')
  const [syncSearch, setSyncSearch] = useState('')
  const [detailState, setDetailState] = useState({
    open: false,
    loading: false,
    saving: false,
    detail: null,
    purchaseCosts: {}
  })

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const response = await client.get('/cost-management/step1/opening-stock', {
        params: { page, limit: PAGE_SIZE, finishType, status, search }
      })
      setRows(response.data?.data || [])
      setSummary(response.data?.summary || emptySummary)
      setPolicy(response.data?.policy || null)
      setTotalCount(Number(response.data?.totalCount) || 0)
    } catch (error) {
      console.error('Failed to load Step 1 opening stock:', error)
      message.error(error.response?.data?.message || 'Failed to load Step 1 opening-stock workspace')
    } finally {
      setLoading(false)
    }
  }, [finishType, page, search, status])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const fetchMatchedPurchaseLines = useCallback(async () => {
    setMatchedLoading(true)
    try {
      const response = await client.get('/cost-management/step1/matched-purchase-lines', {
        params: {
          page: matchedPage,
          limit: MATCH_PAGE_SIZE,
          finishType: matchedFinishType,
          search: matchedSearch
        }
      })
      setMatchedRows(response.data?.data || [])
      setMatchedSummary(response.data?.summary || emptyMatchedSummary)
      setPolicy(response.data?.policy || null)
      setMatchedTotalCount(Number(response.data?.totalCount) || 0)
    } catch (error) {
      console.error('Failed to load Step 1 matched purchase lines:', error)
      message.error(error.response?.data?.message || 'Failed to load matched purchase lines')
    } finally {
      setMatchedLoading(false)
    }
  }, [matchedFinishType, matchedPage, matchedSearch])

  useEffect(() => {
    if (workspace === 'matches') fetchMatchedPurchaseLines()
  }, [fetchMatchedPurchaseLines, workspace])

  const fetchSyncAudit = useCallback(async () => {
    setSyncLoading(true)
    try {
      const response = await client.get('/cost-management/step1/sync-audit', {
        params: {
          page: syncPage,
          limit: SYNC_PAGE_SIZE,
          finishType: syncFinishType,
          status: syncStatus,
          search: syncSearch
        }
      })
      setSyncRows(response.data?.data || [])
      setSyncSummary(response.data?.summary || emptySyncSummary)
      setPolicy(response.data?.policy || null)
      setSyncTotalCount(Number(response.data?.totalCount) || 0)
    } catch (error) {
      console.error('Failed to load Step 1 stock-sync audit:', error)
      message.error(error.response?.data?.message || 'Failed to load Step 1 stock-sync audit')
    } finally {
      setSyncLoading(false)
    }
  }, [syncFinishType, syncPage, syncSearch, syncStatus])

  useEffect(() => {
    if (workspace === 'sync') fetchSyncAudit()
  }, [fetchSyncAudit, workspace])

  const loadProductDetail = useCallback(async productId => {
    setDetailState(previous => ({ ...previous, loading: true }))
    try {
      const response = await client.get(`/cost-management/step1/opening-stock/${productId}/preview`)
      const detail = response.data
      setDetailState(previous => ({
        ...previous,
        loading: false,
        detail,
        purchaseCosts: initialPurchaseCosts(detail.matchedPurchases)
      }))
    } catch (error) {
      console.error('Failed to resolve Step 1 product:', error)
      message.error(error.response?.data?.message || 'Failed to resolve opening-stock sources')
      setDetailState(previous => ({ ...previous, loading: false }))
    }
  }, [])

  const openProduct = row => {
    setDetailState({ open: true, loading: true, saving: false, detail: null, purchaseCosts: {} })
    loadProductDetail(row.productId)
  }

  const purchaseRows = useMemo(
    () => purchaseLineRows(detailState.detail?.matchedPurchases),
    [detailState.detail]
  )

  const calculations = useMemo(() => {
    const detail = detailState.detail
    if (!detail) return { pricedQty: 0, pricedValue: 0, average: 0, outstandingQty: 0, pricedRows: 0, purchaseCostings: {} }
    let pricedQty = 0
    let pricedValue = 0
    let pricedRows = 0
    const purchaseCostings = {}
    purchaseRows.forEach(purchase => {
      const entered = detailState.purchaseCosts?.[purchase.purchaseId] || {}
      const costing = calculatePurchaseLineCosting({
        taxableAmount: entered.taxableAmount,
        gstAmount: entered.gstAmount,
        purchaseQuantity: purchase.purchaseQuantity,
        gstPercent: normalizeGstPercent(entered.gstPercent)
      })
      if (costing) purchaseCostings[purchase.purchaseId] = costing
      const qty = Number(purchase.matchedQty) || 0
      if (costing && costing.unitCost > 0 && qty > 0) {
        pricedQty += qty
        pricedValue += qty * costing.unitCost
        pricedRows += 1
      }
    })
    return {
      pricedQty,
      pricedValue,
      average: pricedQty > 0 ? pricedValue / pricedQty : 0,
      outstandingQty: Math.max(0, Number(detail.product?.openingQty || 0) - pricedQty),
      pricedRows,
      purchaseCostings
    }
  }, [detailState.detail, detailState.purchaseCosts, purchaseRows])

  const matchedLineCostings = useMemo(() => {
    const values = {}
    matchedRows.forEach(row => {
      const entered = matchedPurchaseCosts[row.purchaseId] || {}
      const costing = calculatePurchaseLineCosting({
        taxableAmount: entered.taxableAmount,
        gstAmount: entered.gstAmount,
        purchaseQuantity: row.purchaseQuantity,
        gstPercent: normalizeGstPercent(entered.gstPercent)
      })
      if (costing) values[row.purchaseId] = costing
    })
    return values
  }, [matchedPurchaseCosts, matchedRows])

  const setPurchaseTaxableAmount = (purchaseId, value) => {
    setDetailState(previous => {
      const current = previous.purchaseCosts?.[purchaseId] || {}
      const taxableAmount = value ?? ''
      const gstPercent = normalizeGstPercent(current.gstPercent)
      const automaticGst = Number(taxableAmount) > 0
        ? roundCurrency(Number(taxableAmount) * gstPercent / 100)
        : ''
      return {
        ...previous,
        purchaseCosts: {
          ...(previous.purchaseCosts || {}),
          [purchaseId]: {
            ...current,
            taxableAmount,
            gstPercent,
            gstAmount: current.gstManual ? current.gstAmount : automaticGst
          }
        }
      }
    })
  }

  const setPurchaseGstAmount = (purchaseId, value) => {
    setDetailState(previous => {
      const current = previous.purchaseCosts?.[purchaseId] || {}
      if (value === null || value === undefined) {
        const gstPercent = normalizeGstPercent(current.gstPercent)
        const automaticGst = Number(current.taxableAmount) > 0
          ? roundCurrency(Number(current.taxableAmount) * gstPercent / 100)
          : ''
        return {
          ...previous,
          purchaseCosts: {
            ...(previous.purchaseCosts || {}),
            [purchaseId]: { ...current, gstPercent, gstAmount: automaticGst, gstManual: false }
          }
        }
      }
      return {
        ...previous,
        purchaseCosts: {
          ...(previous.purchaseCosts || {}),
          [purchaseId]: { ...current, gstAmount: value, gstManual: true }
        }
      }
    })
  }

  const setPurchaseGstPercent = (purchaseId, value) => {
    setDetailState(previous => {
      const current = previous.purchaseCosts?.[purchaseId] || {}
      const gstPercent = normalizeGstPercent(value)
      const automaticGst = Number(current.taxableAmount) > 0
        ? roundCurrency(Number(current.taxableAmount) * gstPercent / 100)
        : ''
      return {
        ...previous,
        purchaseCosts: {
          ...(previous.purchaseCosts || {}),
          [purchaseId]: { ...current, gstPercent, gstAmount: automaticGst, gstManual: false }
        }
      }
    })
  }

  const resetPurchaseGst = purchaseId => {
    setDetailState(previous => {
      const current = previous.purchaseCosts?.[purchaseId] || {}
      const gstPercent = normalizeGstPercent(current.gstPercent)
      const automaticGst = Number(current.taxableAmount) > 0
        ? roundCurrency(Number(current.taxableAmount) * gstPercent / 100)
        : ''
      return {
        ...previous,
        purchaseCosts: {
          ...(previous.purchaseCosts || {}),
          [purchaseId]: { ...current, gstPercent, gstAmount: automaticGst, gstManual: false }
        }
      }
    })
  }

  const stageAllocations = async () => {
    const detail = detailState.detail
    if (!detail || calculations.pricedRows <= 0) {
      message.warning('Enter a positive taxable amount for at least one matched purchase line')
      return
    }

    setDetailState(previous => ({ ...previous, saving: true }))
    try {
      const allocations = purchaseRows.flatMap(purchase => {
        const costing = calculations.purchaseCostings[purchase.purchaseId]
        return costing ? [{
          purchaseId: purchase.purchaseId,
          taxableAmount: costing.taxableAmount,
          gstAmount: costing.gstAmount,
          gstPercent: costing.gstPercent
        }] : []
      })
      const response = await client.post(
        `/cost-management/step1/opening-stock/${detail.product.productId}/stage`,
        { allocations }
      )
      message.success(response.data?.message || 'Purchase-line costing approved and opening sources staged')
      await Promise.all([fetchQueue(), loadProductDetail(detail.product.productId)])
    } catch (error) {
      console.error('Failed to stage Step 1 sources:', error)
      message.error(error.response?.data?.message || 'Failed to stage opening-stock sources')
    } finally {
      setDetailState(previous => ({ ...previous, saving: false }))
    }
  }

  const clearStaging = () => {
    const detail = detailState.detail
    if (!detail) return
    Modal.confirm({
      title: 'Clear this product’s Step 1 staging?',
      content: 'The opening allocations will be removed. Approved taxable, GST, and inclusive purchase-line costing stored on Tally will be retained.',
      okText: 'Clear staging',
      okButtonProps: { danger: true },
      async onOk () {
        try {
          const response = await client.delete(
            `/cost-management/step1/opening-stock/${detail.product.productId}/stage`
          )
          message.success(response.data?.message || 'Staging cleared')
          await Promise.all([fetchQueue(), loadProductDetail(detail.product.productId)])
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to clear staged sources')
          throw error
        }
      }
    })
  }

  const columns = [
    {
      title: 'Alloy product',
      key: 'product',
      width: 330,
      fixed: 'left',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 700, color: INK }}>{row.productName}</div>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
            {row.uniqueId || `Product #${row.productId}`}
          </div>
        </div>
      )
    },
    {
      title: 'Finish class',
      key: 'finishType',
      width: 180,
      render: (_, row) => (
        <Space direction='vertical' size={3}>
          <Tag color={row.finishType === 'raw' ? 'gold' : 'blue'}>
            {row.finishType === 'raw' ? 'Raw Finish' : 'Finished Finish'}
          </Tag>
          <Text type='secondary' style={{ fontSize: 12 }}>{row.finish || 'Unspecified finish'}</Text>
        </Space>
      )
    },
    {
      title: 'In-house opening',
      dataIndex: 'openingQty',
      width: 145,
      align: 'right',
      render: value => <strong>{formatQty(value)}</strong>
    },
    {
      title: 'Current opening ledger',
      key: 'current',
      width: 235,
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 650 }}>{row.currentUnitCost == null ? 'No cost' : `${formatMoney(row.currentUnitCost)} / Pc`}</div>
          <Space size={[4, 4]} wrap style={{ marginTop: 5 }}>
            {row.currentExactQty > 0 && <Tag color='green'>{row.currentExactQty} exact</Tag>}
            {row.currentAverageQty > 0 && <Tag color='orange'>{row.currentAverageQty} average</Tag>}
            {row.currentPendingQty > 0 && <Tag color='red'>{row.currentPendingQty} pending</Tag>}
            {row.quantityMismatch && <Tag color='volcano'>Qty mismatch</Tag>}
          </Space>
        </div>
      )
    },
    {
      title: 'Step 1 exact staging',
      key: 'staging',
      width: 250,
      render: (_, row) => {
        const percent = row.openingQty > 0 ? Math.min(100, Math.round((row.stagedQty / row.openingQty) * 100)) : 0
        return (
          <div>
            <Progress percent={percent} size='small' status={percent === 100 ? 'success' : 'active'} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: MUTED, fontSize: 12 }}>
              <span>{row.stagedQty} staged</span>
              <span>{row.outstandingQty} outstanding</span>
            </div>
            {row.stagedUnitCost != null && (
              <div style={{ color: INK, fontSize: 12, fontWeight: 650, marginTop: 3 }}>
                {formatMoney(row.stagedUnitCost)} / Pc staged
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: '5 Jan sync evidence',
      key: 'sync',
      width: 165,
      render: (_, row) => row.syncRows > 0 ? (
        <Space direction='vertical' size={2}>
          <Text style={{ color: '#027a48' }}>+{row.syncInQty} in</Text>
          <Text style={{ color: '#b42318' }}>−{row.syncOutQty} out</Text>
          <Text type='secondary' style={{ fontSize: 11 }}>{row.syncRows} movement rows</Text>
        </Space>
      ) : <Text type='secondary'>No sync rows</Text>
    },
    {
      title: 'Status',
      dataIndex: 'stagingStatus',
      width: 155,
      render: value => {
        const meta = statusMeta[value] || statusMeta.not_started
        return <Tag color={meta.color} icon={meta.icon}>{meta.label}</Tag>
      }
    },
    {
      title: '',
      key: 'action',
      width: 130,
      fixed: 'right',
      render: (_, row) => (
        <Button icon={<EyeOutlined />} onClick={() => openProduct(row)}>
          Review
        </Button>
      )
    }
  ]

  const setMatchedTaxableAmount = (purchaseId, value) => {
    setMatchedPurchaseCosts(previous => {
      const current = previous[purchaseId] || {}
      const taxableAmount = value ?? ''
      const gstPercent = normalizeGstPercent(current.gstPercent)
      const automaticGst = Number(taxableAmount) > 0
        ? roundCurrency(Number(taxableAmount) * gstPercent / 100)
        : ''
      return {
        ...previous,
        [purchaseId]: {
          ...current,
          taxableAmount,
          gstPercent,
          gstAmount: current.gstManual ? current.gstAmount : automaticGst
        }
      }
    })
  }

  const setMatchedGstAmount = (purchaseId, value) => {
    setMatchedPurchaseCosts(previous => {
      const current = previous[purchaseId] || {}
      if (value === null || value === undefined) {
        const gstPercent = normalizeGstPercent(current.gstPercent)
        const automaticGst = Number(current.taxableAmount) > 0
          ? roundCurrency(Number(current.taxableAmount) * gstPercent / 100)
          : ''
        return {
          ...previous,
          [purchaseId]: { ...current, gstPercent, gstAmount: automaticGst, gstManual: false }
        }
      }
      return {
        ...previous,
        [purchaseId]: { ...current, gstAmount: value, gstManual: true }
      }
    })
  }

  const setMatchedGstPercent = (purchaseId, value) => {
    setMatchedPurchaseCosts(previous => {
      const current = previous[purchaseId] || {}
      const gstPercent = normalizeGstPercent(value)
      const automaticGst = Number(current.taxableAmount) > 0
        ? roundCurrency(Number(current.taxableAmount) * gstPercent / 100)
        : ''
      return {
        ...previous,
        [purchaseId]: { ...current, gstPercent, gstAmount: automaticGst, gstManual: false }
      }
    })
  }

  const resetMatchedGst = purchaseId => {
    setMatchedPurchaseCosts(previous => {
      const current = previous[purchaseId] || {}
      const gstPercent = normalizeGstPercent(current.gstPercent)
      const automaticGst = Number(current.taxableAmount) > 0
        ? roundCurrency(Number(current.taxableAmount) * gstPercent / 100)
        : ''
      return {
        ...previous,
        [purchaseId]: { ...current, gstPercent, gstAmount: automaticGst, gstManual: false }
      }
    })
  }

  const approveMatchedPurchaseLine = async row => {
    const costing = matchedLineCostings[row.purchaseId]
    if (!costing) {
      message.warning('Enter a positive taxable purchase-line amount before approving')
      return
    }

    setMatchedSavingId(row.purchaseId)
    try {
      const response = await client.post(
        `/cost-management/step1/matched-purchase-lines/${encodeURIComponent(row.purchaseId)}/approve`,
        {
          taxableAmount: costing.taxableAmount,
          gstAmount: costing.gstAmount,
          gstPercent: costing.gstPercent
        }
      )
      message.success(response.data?.message || 'Purchase line approved and staged')
      setMatchedPurchaseCosts(previous => {
        const next = { ...previous }
        delete next[row.purchaseId]
        return next
      })
      if (matchedRows.length === 1 && matchedPage > 1) {
        setMatchedPage(previous => previous - 1)
        await fetchQueue()
      } else {
        await Promise.all([fetchMatchedPurchaseLines(), fetchQueue()])
      }
    } catch (error) {
      console.error('Failed to approve Step 1 matched purchase line:', error)
      message.error(error.response?.data?.message || 'Failed to approve matched purchase line')
    } finally {
      setMatchedSavingId(null)
    }
  }

  const matchedColumns = placePurchasePricingAfterQuantity([
    {
      title: '#',
      key: 'chronology',
      width: 70,
      align: 'right',
      render: (_, __, index) => (
        <Text type='secondary'>{((matchedPage - 1) * MATCH_PAGE_SIZE) + index + 1}</Text>
      )
    },
    {
      title: 'Purchase date',
      dataIndex: 'purchaseDate',
      width: 135,
      render: value => <strong>{formatDate(value)}</strong>
    },
    {
      title: 'Voucher / line',
      key: 'voucher',
      width: 155,
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 650 }}>{row.voucherNumber ? `Voucher ${row.voucherNumber}` : row.purchaseId}</div>
          <div style={{ color: MUTED, fontSize: 12 }}>
            {row.inventoryLine == null ? row.sourceType : `Inventory line ${row.inventoryLine}`}
          </div>
        </div>
      )
    },
    {
      title: 'Supplier / purchased product',
      key: 'purchaseProduct',
      width: 340,
      render: (_, row) => (
        <div>
          <div style={{ color: INK, fontSize: 16, fontWeight: 700, lineHeight: 1.35 }}>
            {row.supplier}
          </div>
          <div style={{ color: MUTED, fontSize: 15, fontWeight: 500, lineHeight: 1.45, marginTop: 4 }}>
            {row.purchaseProductName}
          </div>
        </div>
      )
    },
    {
      title: 'Purchase line Qty',
      dataIndex: 'purchaseQuantity',
      width: 145,
      align: 'right',
      render: value => <strong>{formatQty(value)}</strong>
    },
    {
      title: 'Available before match',
      dataIndex: 'availableQty',
      width: 155,
      align: 'right',
      render: value => formatQty(value)
    },
    {
      title: 'Matched to outstanding opening stock',
      key: 'openingProducts',
      width: 430,
      render: (_, row) => (
        <div>
          {(row.targetProducts || []).slice(0, 3).map(target => (
            <div key={target.productId} style={{ marginBottom: 5 }}>
              <div style={{ fontWeight: 650 }}>{target.productName}</div>
              <Space size={4} wrap>
                <Tag color={target.finishType === 'raw' ? 'gold' : 'blue'} style={{ marginInlineEnd: 0 }}>
                  {target.finishType === 'raw' ? 'Raw' : 'Finished'}
                </Tag>
                <Text type='secondary' style={{ fontSize: 11 }}>{formatQty(target.matchedQty)}</Text>
                {target.productionIds?.length > 0 && (
                  <Text type='secondary' style={{ fontSize: 11 }}>{target.productionIds.length} production source{target.productionIds.length === 1 ? '' : 's'}</Text>
                )}
              </Space>
            </div>
          ))}
          {(row.targetProducts || []).length > 3 && (
            <Text type='secondary'>+{row.targetProducts.length - 3} more opening products</Text>
          )}
        </div>
      )
    },
    {
      title: 'Matched Qty',
      dataIndex: 'matchedQty',
      width: 125,
      align: 'right',
      render: value => <strong>{formatQty(value)}</strong>
    },
    {
      title: 'Unused after match',
      dataIndex: 'remainingAfterMatchQty',
      width: 145,
      align: 'right',
      render: value => Number(value) > 0 ? formatQty(value) : '—'
    },
    {
      title: 'Taxable purchase-line amount',
      key: 'taxableAmount',
      width: 220,
      render: (_, row) => (
        <InputNumber
          min={0.01}
          precision={2}
          step={1000}
          controls={false}
          style={{ width: '100%' }}
          prefix='₹'
          placeholder='Before GST'
          value={matchedPurchaseCosts[row.purchaseId]?.taxableAmount}
          disabled={Boolean(matchedSavingId)}
          onChange={value => setMatchedTaxableAmount(row.purchaseId, value)}
        />
      )
    },
    {
      title: 'GST rate / amount',
      key: 'gstAmount',
      width: 305,
      render: (_, row) => {
        const entered = matchedPurchaseCosts[row.purchaseId] || {}
        const costing = matchedLineCostings[row.purchaseId]
        return (
          <Space direction='vertical' size={3} style={{ width: '100%' }}>
            <div style={{ display: 'flex', gap: 6, width: '100%' }}>
              <Select
                style={{ width: 92 }}
                aria-label='GST percentage'
                value={normalizeGstPercent(entered.gstPercent)}
                options={GST_PERCENT_OPTIONS}
                disabled={Boolean(matchedSavingId)}
                onChange={value => setMatchedGstPercent(row.purchaseId, value)}
              />
              <InputNumber
                min={0}
                precision={2}
                step={100}
                controls={false}
                style={{ flex: 1 }}
                prefix='₹'
                placeholder='Calculated GST'
                value={entered.gstAmount}
                disabled={Boolean(matchedSavingId)}
                onChange={value => setMatchedGstAmount(row.purchaseId, value)}
              />
            </div>
            <Space size={4} wrap>
              <Tag color={entered.gstManual ? 'gold' : 'blue'} style={{ marginInlineEnd: 0 }}>
                {entered.gstManual ? 'GST amount edited manually' : `${normalizeGstPercent(entered.gstPercent)}% auto`}
              </Tag>
              {entered.gstManual && (
                <Button
                  type='link'
                  size='small'
                  disabled={Boolean(matchedSavingId)}
                  onClick={() => resetMatchedGst(row.purchaseId)}
                  style={{ padding: 0 }}
                >
                  Reset to {normalizeGstPercent(entered.gstPercent)}%
                </Button>
              )}
            </Space>
            {costing && (
              <Text type='secondary' style={{ fontSize: 11 }}>
                {costing.gstPercent}% calculation: {formatMoney(costing.calculatedGstAmount)}
              </Text>
            )}
          </Space>
        )
      }
    },
    {
      title: 'GST-inclusive total',
      key: 'gstInclusiveAmount',
      width: 170,
      align: 'right',
      render: (_, row) => {
        const costing = matchedLineCostings[row.purchaseId]
        return costing ? <strong>{formatMoney(costing.gstInclusiveAmount)}</strong> : <Text type='secondary'>—</Text>
      }
    },
    {
      title: 'Inclusive cost / Pc',
      key: 'unitCost',
      width: 175,
      align: 'right',
      render: (_, row) => {
        const costing = matchedLineCostings[row.purchaseId]
        return costing ? (
          <div>
            <strong style={{ color: '#067647' }}>{formatMoney(costing.unitCost)}</strong>
            <div style={{ color: MUTED, fontSize: 11 }}>total ÷ purchase line Qty</div>
          </div>
        ) : <Text type='secondary'>—</Text>
      }
    },
    {
      title: 'Approval status',
      dataIndex: 'approvalStatus',
      width: 135,
      render: () => <Tag color='warning'>Unapproved</Tag>
    },
    {
      title: '',
      key: 'approve',
      width: 175,
      fixed: 'right',
      render: (_, row) => {
        const costing = matchedLineCostings[row.purchaseId]
        return (
          <Button
            type='primary'
            icon={<SaveOutlined />}
            loading={matchedSavingId === row.purchaseId}
            disabled={!costing || (Boolean(matchedSavingId) && matchedSavingId !== row.purchaseId)}
            onClick={() => approveMatchedPurchaseLine(row)}
            style={{ background: ORANGE }}
          >
            Approve {formatQty(row.matchedQty)}
          </Button>
        )
      }
    }
  ])

  const syncColumns = [
    {
      title: 'Alloy product',
      key: 'product',
      width: 320,
      fixed: 'left',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 700, color: INK }}>{row.productName}</div>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
            {row.uniqueId || `Product #${row.productId}`} · Movement #{row.movementId}
          </div>
        </div>
      )
    },
    {
      title: 'Finish class',
      key: 'finishType',
      width: 175,
      render: (_, row) => (
        <Space direction='vertical' size={3}>
          <Tag color={row.finishType === 'raw' ? 'gold' : 'blue'}>
            {row.finishType === 'raw' ? 'Raw Finish' : 'Finished Finish'}
          </Tag>
          <Text type='secondary' style={{ fontSize: 12 }}>{row.finish || 'Unspecified finish'}</Text>
        </Space>
      )
    },
    {
      title: 'Sync timestamp',
      dataIndex: 'createdAt',
      width: 190,
      render: formatDateTime
    },
    {
      title: 'Quantity transition',
      key: 'transition',
      width: 185,
      render: (_, row) => (
        <div>
          <Tag color={row.movementType === 'in' ? 'green' : 'red'}>
            {row.movementType === 'in' ? '+' : '−'}{formatQty(row.quantityChange)}
          </Tag>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 5 }}>
            {row.previousQuantity} → {row.newQuantity}
          </div>
        </div>
      )
    },
    {
      title: 'Approved opening snapshot',
      dataIndex: 'snapshotQty',
      width: 175,
      align: 'right',
      render: value => value == null ? 'Not found' : formatQty(value)
    },
    {
      title: 'Step 1 classification',
      dataIndex: 'auditStatus',
      width: 220,
      render: value => {
        const meta = syncStatusMeta[value] || syncStatusMeta.no_cost_event
        return <Tag color={meta.color} icon={meta.icon}>{meta.label}</Tag>
      }
    },
    {
      title: 'Replay treatment',
      dataIndex: 'replayAction',
      width: 360,
      render: value => <Text style={{ fontSize: 13 }}>{value}</Text>
    },
    {
      title: 'Original sync note',
      dataIndex: 'notes',
      width: 330,
      render: value => <Text type='secondary' style={{ fontSize: 12 }}>{value || '—'}</Text>
    }
  ]

  const productionColumns = [
    {
      title: 'Production',
      key: 'production',
      width: 245,
      render: (_, row) => (
        <div>
          {row.productionSourceType === 'tally-cash-conversion' ? (
            <>
              <Tag color='purple' style={{ marginBottom: 3 }}>Tally Cash conversion</Tag>
              <div style={{ color: INK, fontSize: 12, fontWeight: 650 }}>
                Purchase {row.cashPurchaseVoucherNumber ? `#${row.cashPurchaseVoucherNumber}` : `voucher ${row.cashPurchaseVoucherId}`}
                {row.cashSalesVoucherNumbers?.length > 0
                  ? ` · Raw issue ${row.cashSalesVoucherNumbers.map(value => `#${value}`).join(', ')}`
                  : ''}
              </div>
            </>
          ) : (
            <strong>#{row.productionId}</strong>
          )}
          <div style={{ color: MUTED, fontSize: 12 }}>{formatDate(row.productionDate)}</div>
        </div>
      )
    },
    { title: 'Raw Finish used', dataIndex: 'rawProductName', ellipsis: true },
    { title: 'Completed', dataIndex: 'completedProductionQty', align: 'right', render: formatQty },
    {
      title: 'Lineage',
      key: 'lineage',
      width: 125,
      render: (_, row) => row.productionSourceType === 'tally-cash-conversion'
        ? row.lineageStatus === 'matched'
          ? <Tag color='green'>Cash pair matched</Tag>
          : <Tag color='orange'>{row.lineageStatus === 'partial' ? 'Partial pair' : 'Unmatched pair'}</Tag>
        : <Tag color='blue'>Production record</Tag>
    },
    {
      title: 'Used for opening',
      dataIndex: 'matchedFinishedQty',
      align: 'right',
      render: value => Number(value) > 0 ? <Tag color='blue'>{formatQty(value)}</Tag> : '—'
    }
  ]

  const purchaseColumns = placePurchasePricingAfterQuantity([
    {
      title: 'Purchase voucher',
      key: 'source',
      width: 190,
      render: (_, row) => (
        <div>
          <strong>{formatDate(row.date)}</strong>
          <div style={{ color: MUTED, fontSize: 12 }}>{row.voucherNumber ? `Voucher ${row.voucherNumber}` : row.purchaseId}</div>
          <div style={{ color: MUTED, fontSize: 11 }}>
            {row.sourceLineIndex == null ? 'Exact purchase record' : `Inventory line ${Number(row.sourceLineIndex) + 1}`}
          </div>
        </div>
      )
    },
    {
      title: 'Supplier / product',
      key: 'supplier',
      render: (_, row) => (
        <div>
          <div style={{ color: INK, fontSize: 16, fontWeight: 700, lineHeight: 1.35 }}>
            {row.dealerName}
          </div>
          <div style={{ color: MUTED, fontSize: 15, fontWeight: 500, lineHeight: 1.45, marginTop: 4 }}>
            {row.productName || 'Product not named'}
          </div>
        </div>
      )
    },
    {
      title: 'Purchase line Qty',
      dataIndex: 'purchaseQuantity',
      width: 155,
      align: 'right',
      render: (value, row) => (
        <div>
          <strong>{formatQty(value)}</strong>
          {row.voucherLineCount > 1 && (
            <div style={{ color: MUTED, fontSize: 11 }}>This line only · voucher has {row.voucherLineCount} lines</div>
          )}
        </div>
      )
    },
    {
      title: 'Used for opening',
      dataIndex: 'matchedQty',
      width: 120,
      align: 'right',
      render: value => <strong>{formatQty(value)}</strong>
    },
    {
      title: 'Taxable purchase-line amount',
      key: 'taxableAmount',
      width: 225,
      render: (_, row) => (
        <InputNumber
          min={0.01}
          precision={2}
          step={1000}
          controls={false}
          style={{ width: '100%' }}
          prefix='₹'
          placeholder='Before GST'
          value={detailState.purchaseCosts?.[row.purchaseId]?.taxableAmount}
          onChange={value => setPurchaseTaxableAmount(row.purchaseId, value)}
        />
      )
    },
    {
      title: 'GST rate / amount',
      key: 'gstAmount',
      width: 305,
      render: (_, row) => {
        const entered = detailState.purchaseCosts?.[row.purchaseId] || {}
        const costing = calculations.purchaseCostings[row.purchaseId]
        return (
          <Space direction='vertical' size={3} style={{ width: '100%' }}>
            <div style={{ display: 'flex', gap: 6, width: '100%' }}>
              <Select
                style={{ width: 92 }}
                aria-label='GST percentage'
                value={normalizeGstPercent(entered.gstPercent)}
                options={GST_PERCENT_OPTIONS}
                onChange={value => setPurchaseGstPercent(row.purchaseId, value)}
              />
              <InputNumber
                min={0}
                precision={2}
                step={100}
                controls={false}
                style={{ flex: 1 }}
                prefix='₹'
                placeholder='Calculated GST'
                value={entered.gstAmount}
                onChange={value => setPurchaseGstAmount(row.purchaseId, value)}
              />
            </div>
            <Space size={4} wrap>
              <Tag color={entered.gstManual ? 'gold' : 'blue'} style={{ marginInlineEnd: 0 }}>
                {entered.gstManual ? 'GST amount edited manually' : `${normalizeGstPercent(entered.gstPercent)}% auto`}
              </Tag>
              {entered.gstManual && (
                <Button type='link' size='small' onClick={() => resetPurchaseGst(row.purchaseId)} style={{ padding: 0 }}>
                  Reset to {normalizeGstPercent(entered.gstPercent)}%
                </Button>
              )}
            </Space>
            {costing && (
              <Text type='secondary' style={{ fontSize: 11 }}>
                {costing.gstPercent}% calculation: {formatMoney(costing.calculatedGstAmount)}
              </Text>
            )}
          </Space>
        )
      }
    },
    {
      title: 'GST-inclusive total',
      key: 'inclusiveTotal',
      width: 165,
      align: 'right',
      render: (_, row) => {
        const costing = calculations.purchaseCostings[row.purchaseId]
        return costing ? <strong>{formatMoney(costing.gstInclusiveAmount)}</strong> : <Text type='secondary'>—</Text>
      }
    },
    {
      title: 'Inclusive cost / Pc',
      key: 'unitCost',
      width: 165,
      align: 'right',
      render: (_, row) => {
        const costing = calculations.purchaseCostings[row.purchaseId]
        return costing ? (
          <div>
            <strong style={{ color: '#067647' }}>{formatMoney(costing.unitCost)}</strong>
            <div style={{ color: MUTED, fontSize: 11 }}>total ÷ purchase line Qty</div>
          </div>
        ) : <Text type='secondary'>—</Text>
      }
    }
  ])

  const detail = detailState.detail
  const workspaceLoading = workspace === 'opening'
    ? loading
    : workspace === 'matches' ? matchedLoading : syncLoading
  const refreshWorkspace = workspace === 'opening'
    ? fetchQueue
    : workspace === 'matches' ? fetchMatchedPurchaseLines : fetchSyncAudit

  return (
    <div style={{ width: '100%', color: INK }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <PageTitle>Step 1 · Stock Sync Costing</PageTitle>
          <div style={{ color: MUTED, fontSize: 14, maxWidth: 850, marginTop: -12 }}>
            A separate local workspace for reconstructing the 5 January 2026 in-house opening layers and preventing the same stock-sync quantities from entering FIFO twice.
          </div>
        </div>
        <Button
          icon={<ReloadOutlined spin={workspaceLoading} />}
          onClick={refreshWorkspace}
          disabled={workspaceLoading}
        >
          Refresh view
        </Button>
      </div>

      <Segmented
        block
        value={workspace}
        onChange={setWorkspace}
        options={[
          { value: 'opening', label: 'Opening Cost Reconstruction', icon: <InboxOutlined /> },
          { value: 'matches', label: 'Unapproved Matched Lines', icon: <OrderedListOutlined /> },
          { value: 'sync', label: '5 Jan Stock-Sync Audit', icon: <SwapOutlined /> }
        ]}
        style={{ marginTop: 20, marginBottom: 18, maxWidth: 980 }}
      />

      {workspace === 'opening' ? (
        <>
      <Alert
        showIcon
        icon={<SafetyCertificateOutlined />}
        type='info'
        style={{ marginTop: 20, marginBottom: 18, borderRadius: 12 }}
        message='Staging workspace only — it does not replay FIFO, alter current stock, or stamp any sale.'
        description={
          <Space size={[6, 6]} wrap>
            <Tag color='blue'>Epoch: {policy?.epoch || '2026-01-05'}</Tag>
            <Tag color='purple'>In-house only</Tag>
            <Tag color='cyan'>Taxable purchase line + editable GST</Tag>
            <Tag>Freight excluded</Tag>
            <Tag color='gold'>Material-only</Tag>
            <Tooltip title={policy?.code}><Tag>Policy v3</Tag></Tooltip>
          </Space>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <KpiCard title='Opening stock' value={summary.totalQty} suffix='Pcs' helper={`${summary.totalProducts.toLocaleString('en-IN')} alloy products`} icon={<InboxOutlined />} />
        <KpiCard title='Raw Finish' value={summary.rawQty} suffix='Pcs' helper={`${summary.rawProducts.toLocaleString('en-IN')} products`} color='#b54708' icon={<ApartmentOutlined />} />
        <KpiCard title='Finished Finish' value={summary.finishedQty} suffix='Pcs' helper={`${summary.finishedProducts.toLocaleString('en-IN')} products`} color='#175cd3' icon={<ApartmentOutlined />} />
        <KpiCard title='Exact sources staged' value={summary.stagedQty} suffix='Pcs' helper={`${summary.readyProducts} products fully ready`} color='#067647' icon={<CheckCircleOutlined />} />
        <KpiCard title='Still outstanding' value={summary.outstandingQty} suffix='Pcs' helper={`${summary.partialProducts} partial · ${summary.notStartedProducts} not started`} color='#b42318' icon={<WarningOutlined />} />
        <KpiCard title='Opening ledger pending' value={summary.currentPendingQty} suffix='Pcs' helper={`${summary.quantityMismatchProducts} quantity mismatches`} color='#7a5af8' icon={<AuditOutlined />} />
      </div>

      <Card style={{ borderRadius: 16, borderColor: BORDER }} styles={{ body: { padding: 16 } }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder='Search product, unique ID, or finish'
            value={searchDraft}
            onChange={event => setSearchDraft(event.target.value)}
            onPressEnter={() => { setPage(1); setSearch(searchDraft.trim()) }}
            style={{ width: 360, maxWidth: '100%' }}
          />
          <Button onClick={() => { setPage(1); setSearch(searchDraft.trim()) }}>Search</Button>
          <Select
            value={finishType}
            onChange={value => { setPage(1); setFinishType(value) }}
            style={{ width: 180 }}
            options={[
              { value: 'all', label: 'All finish classes' },
              { value: 'raw', label: 'Raw Finish only' },
              { value: 'finished', label: 'Finished Finish only' }
            ]}
          />
          <Select
            value={status}
            onChange={value => { setPage(1); setStatus(value) }}
            style={{ width: 190 }}
            options={[
              { value: 'all', label: 'All staging statuses' },
              { value: 'not_started', label: 'Not started' },
              { value: 'partial', label: 'Partially staged' },
              { value: 'ready', label: 'Ready for replay' },
              { value: 'mismatch', label: 'Quantity mismatch' }
            ]}
          />
          <div style={{ marginLeft: 'auto', color: MUTED, fontSize: 13 }}>
            Showing {rows.length.toLocaleString('en-IN')} of {totalCount.toLocaleString('en-IN')} filtered products
          </div>
        </div>

        <Table
          rowKey='productId'
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 1500 }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: totalCount,
            showSizeChanger: false,
            onChange: nextPage => setPage(nextPage),
            showTotal: total => `${total.toLocaleString('en-IN')} products`
          }}
        />
      </Card>
        </>
      ) : workspace === 'matches' ? (
        <>
          <Alert
            showIcon
            icon={<OrderedListOutlined />}
            type={matchedSummary.totalMatchedLines > 0 ? 'warning' : 'success'}
            style={{ marginBottom: 18, borderRadius: 12 }}
            message='Unapproved purchase-line matches in chronological order'
            description='Enter the taxable amount, choose the GST percentage (for example 18% or 28%), review the automatically calculated GST, and approve that row. The final GST amount remains editable when invoice evidence requires an override.'
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
            <KpiCard title='Unapproved purchase lines' value={matchedSummary.totalMatchedLines} helper={`${matchedSummary.distinctVouchers} purchase vouchers`} color='#b54708' icon={<OrderedListOutlined />} />
            <KpiCard title='Pending matched quantity' value={matchedSummary.totalMatchedQty} suffix='Pcs' helper={`${matchedSummary.distinctOpeningProducts} opening products`} color='#b54708' icon={<ClockCircleOutlined />} />
            <KpiCard title='Outstanding opening stock' value={matchedSummary.outstandingOpeningQty} suffix='Pcs' helper='After approved staged quantities' color='#175cd3' icon={<InboxOutlined />} />
            <KpiCard title='Raw Finish pending' value={matchedSummary.rawMatchedQty} suffix='Pcs' helper={`${matchedSummary.rawMatchedLines} unapproved purchase lines`} color='#b54708' icon={<ApartmentOutlined />} />
            <KpiCard title='Finished Finish pending' value={matchedSummary.finishedMatchedQty} suffix='Pcs' helper={`${matchedSummary.finishedMatchedLines} unapproved purchase lines`} color='#175cd3' icon={<ApartmentOutlined />} />
            <KpiCard title='Still unresolved' value={matchedSummary.totalUnresolvedQty} suffix='Pcs' helper={`${Number(matchedSummary.unresolvedLineageQty || 0).toLocaleString('en-IN')} lineage · ${Number(matchedSummary.unmatchedPurchaseQty || 0).toLocaleString('en-IN')} no purchase`} color='#b42318' icon={<WarningOutlined />} />
          </div>

          <Card style={{ borderRadius: 16, borderColor: BORDER }} styles={{ body: { padding: 16 } }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder='Search voucher, supplier, purchased product, or opening product'
                value={matchedSearchDraft}
                onChange={event => setMatchedSearchDraft(event.target.value)}
                onPressEnter={() => { setMatchedPage(1); setMatchedSearch(matchedSearchDraft.trim()) }}
                style={{ width: 500, maxWidth: '100%' }}
              />
              <Button onClick={() => { setMatchedPage(1); setMatchedSearch(matchedSearchDraft.trim()) }}>
                Search
              </Button>
              <Select
                value={matchedFinishType}
                onChange={value => { setMatchedPage(1); setMatchedFinishType(value) }}
                style={{ width: 190 }}
                options={[
                  { value: 'all', label: 'All finish classes' },
                  { value: 'raw', label: 'Raw Finish only' },
                  { value: 'finished', label: 'Finished Finish only' }
                ]}
              />
              <Tag color='blue'>Oldest → newest</Tag>
              <div style={{ marginLeft: 'auto', color: MUTED, fontSize: 13 }}>
                Showing {matchedRows.length.toLocaleString('en-IN')} of {matchedTotalCount.toLocaleString('en-IN')} unapproved lines
              </div>
            </div>

            <Table
              rowKey='matchId'
              loading={matchedLoading}
              columns={matchedColumns}
              dataSource={matchedRows}
              scroll={{ x: 2960 }}
              pagination={{
                current: matchedPage,
                pageSize: MATCH_PAGE_SIZE,
                total: matchedTotalCount,
                showSizeChanger: false,
                onChange: nextPage => setMatchedPage(nextPage),
                showTotal: total => `${total.toLocaleString('en-IN')} unapproved purchase lines`
              }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='No unapproved matched purchase lines remain' /> }}
            />
          </Card>
        </>
      ) : (
        <>
          <Alert
            showIcon
            type={syncSummary.openingReview > 0 ? 'warning' : 'success'}
            style={{ marginBottom: 18, borderRadius: 12 }}
            message='The stock-sync rows are evidence, not another opening-stock source.'
            description={
              <span>
                {syncSummary.snapshotMirrors.toLocaleString('en-IN')} movements finish exactly at the approved 5 January snapshot and must be excluded from replay to prevent duplicate quantity. {syncSummary.openingReview.toLocaleString('en-IN')} same-day movements differ from the snapshot and remain isolated for causal review.
              </span>
            }
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
            <KpiCard title='Sync movement rows' value={syncSummary.totalMovements} helper='All in-house alloy sync events from the epoch' icon={<SwapOutlined />} />
            <KpiCard title='Sync increases' value={syncSummary.inQty} suffix='Pcs' helper={`${syncSummary.inMovements} movement rows`} color='#067647' icon={<InboxOutlined />} />
            <KpiCard title='Sync decreases' value={syncSummary.outQty} suffix='Pcs' helper={`${syncSummary.outMovements} movement rows`} color='#b42318' icon={<WarningOutlined />} />
            <KpiCard title='Snapshot mirrors' value={syncSummary.snapshotMirrors} helper='Exclude: already carried by opening stock' color='#175cd3' icon={<CheckCircleOutlined />} />
            <KpiCard title='Manual review' value={syncSummary.openingReview} helper='Same-day quantity differs from snapshot' color='#b54708' icon={<AuditOutlined />} />
          </div>

          <Card style={{ borderRadius: 16, borderColor: BORDER }} styles={{ body: { padding: 16 } }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder='Search product, movement ID, or sync note'
                value={syncSearchDraft}
                onChange={event => setSyncSearchDraft(event.target.value)}
                onPressEnter={() => { setSyncPage(1); setSyncSearch(syncSearchDraft.trim()) }}
                style={{ width: 380, maxWidth: '100%' }}
              />
              <Button onClick={() => { setSyncPage(1); setSyncSearch(syncSearchDraft.trim()) }}>
                Search
              </Button>
              <Select
                value={syncFinishType}
                onChange={value => { setSyncPage(1); setSyncFinishType(value) }}
                style={{ width: 180 }}
                options={[
                  { value: 'all', label: 'All finish classes' },
                  { value: 'raw', label: 'Raw Finish only' },
                  { value: 'finished', label: 'Finished Finish only' }
                ]}
              />
              <Select
                value={syncStatus}
                onChange={value => { setSyncPage(1); setSyncStatus(value) }}
                style={{ width: 225 }}
                options={[
                  { value: 'all', label: 'All sync classifications' },
                  { value: 'snapshot_mirror', label: 'Opening snapshot mirrors' },
                  { value: 'opening_review', label: 'Same-day review needed' },
                  { value: 'count_gain', label: 'Later count gains' },
                  { value: 'count_loss', label: 'Later count losses' }
                ]}
              />
              <div style={{ marginLeft: 'auto', color: MUTED, fontSize: 13 }}>
                Showing {syncRows.length.toLocaleString('en-IN')} of {syncTotalCount.toLocaleString('en-IN')} filtered movements
              </div>
            </div>

            <Table
              rowKey='movementId'
              loading={syncLoading}
              columns={syncColumns}
              dataSource={syncRows}
              scroll={{ x: 1960 }}
              pagination={{
                current: syncPage,
                pageSize: SYNC_PAGE_SIZE,
                total: syncTotalCount,
                showSizeChanger: false,
                onChange: nextPage => setSyncPage(nextPage),
                showTotal: total => `${total.toLocaleString('en-IN')} movements`
              }}
            />
          </Card>
        </>
      )}

      <Drawer
        open={detailState.open}
        onClose={() => setDetailState({ open: false, loading: false, saving: false, detail: null, purchaseCosts: {} })}
        width='min(1440px, 98vw)'
        destroyOnClose
        title={detail ? (
          <div>
            <div style={{ fontWeight: 750 }}>Step 1 source review</div>
            <div style={{ color: MUTED, fontSize: 12, fontWeight: 400 }}>{detail.product.productName}</div>
          </div>
        ) : 'Step 1 source review'}
        extra={detail && (
          <Tag color={detail.product.finishType === 'raw' ? 'gold' : 'blue'}>
            {detail.product.finishType === 'raw' ? 'Raw Finish' : 'Finished Finish'}
          </Tag>
        )}
      >
        {detailState.loading && !detail ? (
          <div style={{ padding: 60, textAlign: 'center' }}><ReloadOutlined spin style={{ fontSize: 28, color: ORANGE }} /></div>
        ) : detail ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 18 }}>
              <Card size='small'><Statistic title='Opening required' value={detail.product.openingQty} suffix='Pcs' /></Card>
              <Card size='small'><Statistic title='Qty covered by priced purchase lines' value={calculations.pricedQty} suffix='Pcs' valueStyle={{ color: '#067647' }} /></Card>
              <Card size='small'><Statistic title='Still unresolved' value={calculations.outstandingQty} suffix='Pcs' valueStyle={{ color: calculations.outstandingQty > 0 ? '#b42318' : '#067647' }} /></Card>
              <Card size='small'><Statistic title='Projected material cost' value={calculations.average} precision={2} prefix='₹' suffix='/ Pc' /></Card>
            </div>

            <Alert
              type={detail.remainingUnmatchedQty > 0 ? 'warning' : 'success'}
              showIcon
              style={{ borderRadius: 10, marginBottom: 18 }}
              message={detail.remainingUnmatchedQty > 0
                ? `${formatQty(detail.remainingUnmatchedQty)} could not be matched to eligible pre-epoch source evidence.`
                : 'The opening quantity is fully covered by eligible source evidence.'}
              description={`${sourceLabels[detail.source] || detail.source}. Enter the taxable amount for each exact purchase line; the approved material cost uses taxable amount + final GST, with freight excluded.`}
            />

            {detail.product.finishType === 'finished' && (
              <div style={{ marginBottom: 22 }}>
                <Title level={5} style={{ marginBottom: 4 }}>Production lineage before opening</Title>
                <Text type='secondary'>Operational production is used first. Any remaining opening quantity can use a fully paired legacy Tally Cash conversion, where Cash Sales is the Raw Finish issue and Cash Purchase is the finished receipt.</Text>
                {(detail.productionCandidates || []).some(row => row.productionSourceType === 'tally-cash-conversion') && (
                  <Alert
                    type='info'
                    showIcon
                    style={{ marginTop: 10, borderRadius: 10 }}
                    message='Cash entries are production evidence, not taxable purchases or customer sales'
                    description='Their quantity transfers lineage from the Raw Finish to the finished wheel. Only the genuine supplier purchase lines listed below require taxable amount and GST approval.'
                  />
                )}
                <Table
                  style={{ marginTop: 10 }}
                  size='small'
                  rowKey='productionId'
                  columns={productionColumns}
                  dataSource={detail.productionCandidates || []}
                  pagination={(detail.productionCandidates || []).length > 6 ? { pageSize: 6, showSizeChanger: false } : false}
                  locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='No completed production found before opening' /> }}
                />
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <Title level={5} style={{ marginBottom: 4 }}>Matched purchase lines</Title>
                  <Text type='secondary'>Enter the taxable amount for each matched product line. GST is calculated at {DEFAULT_ALLOY_GST_PERCENT}% and remains directly editable before approval.</Text>
                </div>
                <Tag color='cyan'>{sourceLabels[detail.source] || detail.source}</Tag>
              </div>
              <Alert
                type='info'
                showIcon
                style={{ marginTop: 10, borderRadius: 10 }}
                message='Costing uses the matched product line quantity'
                description='GST-inclusive purchase-line total ÷ that exact line quantity becomes the unit cost. Other products in the same Tally voucher remain independent and are not changed.'
              />
              <Table
                style={{ marginTop: 10 }}
                size='small'
                rowKey='purchaseId'
                columns={purchaseColumns}
                dataSource={purchaseRows}
                pagination={false}
                scroll={{ x: 1640 }}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='No eligible purchase line was found' /> }}
              />
            </div>

            {detail.stagedOverrides?.length > 0 && (
              <Alert
                style={{ marginTop: 18, borderRadius: 10 }}
                type='info'
                showIcon
                message={`${formatQty(detail.stagedQty)} are currently staged across ${detail.stagedOverrides.length} exact opening rows.`}
                description={`Staged value: ${formatMoney(detail.stagedValue)}. Saving again replaces this product’s current Step 1 staging.`}
              />
            )}

            <div style={{ position: 'sticky', bottom: 0, background: 'white', borderTop: `1px solid ${BORDER}`, margin: '24px -24px -24px', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ color: MUTED, fontSize: 12 }}>
                Approval stores GST evidence on the exact Tally purchase line and stages opening overrides only. Other voucher lines, current FIFO layers, and sales remain unchanged.
              </div>
              <Space wrap>
                {detail.stagedOverrides?.length > 0 && (
                  <Button danger icon={<DeleteOutlined />} onClick={clearStaging} disabled={detailState.saving}>
                    Clear staging
                  </Button>
                )}
                <Button onClick={() => loadProductDetail(detail.product.productId)} icon={<SyncOutlined />} disabled={detailState.loading || detailState.saving}>
                  Re-resolve
                </Button>
                <Button
                  type='primary'
                  icon={<SaveOutlined />}
                  loading={detailState.saving}
                  disabled={calculations.pricedRows <= 0 || detailState.loading}
                  onClick={stageAllocations}
                  style={{ background: ORANGE }}
                >
                  Approve &amp; stage {formatQty(calculations.pricedQty)}
                </Button>
              </Space>
            </div>
          </div>
        ) : (
          <Empty description='Unable to load source review' />
        )}
      </Drawer>
    </div>
  )
}

export default Step1OpeningStockPage
