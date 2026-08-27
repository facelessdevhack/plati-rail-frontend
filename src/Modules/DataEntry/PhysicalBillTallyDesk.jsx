import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { message, Modal, Input, Select, DatePicker, Tooltip, Tag } from 'antd'
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ReloadOutlined,
  SearchOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  CodeOutlined,
  ImportOutlined,
  CheckOutlined,
  WarningOutlined
} from '@ant-design/icons'
import moment from 'moment'

import PageTitle from '../../Core/Components/PageTitle'
import DataTablePagination from '../../Core/Components/DataTablePagination'
import { client } from '../../Utils/axiosClient'

const { RangePicker } = DatePicker
const { TextArea } = Input

const FONT = "'Inter', sans-serif"
const INK = '#1a1a1a'
const MUTED = '#6c757d'
const BORDER = '#e5e5e5'
const ORANGE = '#f26c2d'

const COST_LEDGER_TABS = {
  purchases_cost: 'purchases',
  stock_cost: 'stock',
  sales_cost: 'sales'
}

const MAIN_TABS = [
  { id: 'bills', label: '🧾 Paper Bills & Dealer Transactions' },
  { id: 'inventory_in', label: '📥 Inventory In' },
  { id: 'purchases_cost', label: '🛒 Purchase Costs' },
  { id: 'stock_cost', label: '🏬 Stock Costs' },
  { id: 'sales_cost', label: '💸 Sales Costs' }
]

const emptyCostLedgerSummary = () => ({
  totalRows: 0,
  costedRows: 0,
  pendingRows: 0,
  totalQuantity: 0,
  totalValue: 0
})

const rawCostingSourceLabels = {
  fifo: 'FIFO opening / purchase layers',
  purchases: 'Imported purchase entries',
  'tally-xml-archive': 'Tally XML archive',
  mixed: 'Multiple purchase sources',
  none: 'Unavailable'
}

const getBillTallyAmount = row => {
  const value = row?.amount ?? row?.price ?? row?.totalPrice ?? row?.totalCost
  return Number(value) || 0
}

const PhysicalBillTallyDesk = () => {
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState([])
  const [summary, setSummary] = useState({
    totalCount: 0,
    talliedCount: 0,
    needsAttentionCount: 0,
    untalliedCount: 0,
    totalQuantity: 0,
    talliedQuantity: 0,
    needsAttentionQuantity: 0,
    untalliedQuantity: 0
  })
  const [dealersOptions, setDealersOptions] = useState([])

  // Main desk section: bill audit, inventory-in audit, or one of the cost ledgers.
  const [mainTab, setMainTab] = useState('bills')
  const costLedgerView = COST_LEDGER_TABS[mainTab] || null
  const isAuditTab = !costLedgerView
  const [costLedgerLoading, setCostLedgerLoading] = useState(false)
  const [costLedgerRows, setCostLedgerRows] = useState([])
  const [costLedgerSummary, setCostLedgerSummary] = useState(emptyCostLedgerSummary)
  const [costStatusFilter, setCostStatusFilter] = useState('all')
  const [costSearchDraft, setCostSearchDraft] = useState('')

  // Tally ERP 9 Server Connection State (default 192.168.0.175:9000)
  const [tallyServer, setTallyServer] = useState({
    checking: false,
    online: false,
    host: '192.168.0.175',
    port: 9000,
    companies: [],
    message: ''
  })
  const [syncingTally, setSyncingTally] = useState(false)

  // Filters
  const [selectedDealer, setSelectedDealer] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [sourceType, setSourceType] = useState('all')
  const [referenceType, setReferenceType] = useState('all')
  const [categoryClass, setCategoryClass] = useState('all') // 'all', 'finished', 'raw'
  const [finishSpec, setFinishSpec] = useState('all') // 'all', 'raw_finish', 'lacquered'
  const [tallyStatusFilter, setTallyStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)

  // Note Modal State
  const [noteModal, setNoteModal] = useState({
    open: false,
    item: null,
    status: 0,
    notes: ''
  })
  const [updating, setUpdating] = useState(false)

  // Raw Finish Costing Modal State
  const [costingModal, setCostingModal] = useState({
    open: false,
    loading: false,
    stamping: false,
    entryType: 'sales',
    entryDetails: null,
    purchaseSource: 'none',
    productionCandidates: [],
    productionSources: [],
    matchedPurchases: [],
    remainingUnmatchedQty: 0,
    unitCosts: {} // { [purchaseId]: number }
  })

  // XML Paste / Archive Modal State
  const [xmlModal, setXmlModal] = useState({
    open: false,
    step: 'paste',   // 'paste' | 'preview' | 'done'
    xml: '',
    file: null,
    parsing: false,
    importing: false,
    preview: null,   // { total, matched, unmatched, vouchers[] }
    result: null     // { archivedCount, skippedExisting, message }
  })

  // ─── Check Tally ERP 9 Connection ───
  const checkTallyConnection = useCallback(async () => {
    setTallyServer(prev => ({ ...prev, checking: true }))
    try {
      const res = await client.get('/tally/status')
      if (res.data && res.data.status) {
        setTallyServer({
          checking: false,
          online: res.data.status.online,
          host: res.data.status.host || '192.168.0.175',
          port: res.data.status.port || 9000,
          companies: res.data.status.companies || [],
          message: res.data.status.message || ''
        })
      }
    } catch (err) {
      setTallyServer({
        checking: false,
        online: false,
        host: '192.168.0.175',
        port: 9000,
        companies: [],
        message: err.message || 'Offline'
      })
    }
  }, [])

  useEffect(() => {
    checkTallyConnection()
  }, [checkTallyConnection])

  // ─── Sync Live Vouchers from Tally ERP 9 ───
  const syncTallyVouchers = async () => {
    setSyncingTally(true)
    try {
      const res = await client.post('/tally/sync-to-tally-desk', {
        host: tallyServer.host || '192.168.0.175',
        port: tallyServer.port || 9000,
        startDate: '2025-04-01',
        endDate: moment().format('YYYY-MM-DD')
      })
      if (res.data && res.data.success) {
        message.success(res.data.message || 'Synced vouchers from Tally ERP 9!')
        if (costLedgerView === 'purchases') fetchCostLedger()
        else fetchTallyEntries()
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to sync Tally vouchers')
    } finally {
      setSyncingTally(false)
    }
  }
  // ─── Parse Tally XML (offline / paste or file import) ───
  const encodeXmlBase64 = text => {
    const bytes = new TextEncoder().encode(text)
    let binary = ''
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
    }
    return window.btoa(binary)
  }

  const buildXmlRequest = () => {
    if (xmlModal.file) {
      const formData = new FormData()
      formData.append('file', xmlModal.file)
      return {
        body: formData,
        config: { headers: { 'Content-Type': 'multipart/form-data' } }
      }
    }
    return { body: { xmlBase64: encodeXmlBase64(xmlModal.xml) }, config: undefined }
  }

  const parseXmlVouchers = async () => {
    if (!xmlModal.file && !xmlModal.xml.trim()) {
      message.warning('Choose a .xml file or paste Tally XML first')
      return
    }
    setXmlModal(prev => ({ ...prev, parsing: true }))
    try {
      const request = buildXmlRequest()
      const res = await client.post('/tally/parse-xml', request.body, request.config)
      if (res.data && res.data.success) {
        setXmlModal(prev => ({ ...prev, parsing: false, step: 'preview', preview: res.data }))
      } else {
        message.error(res.data?.message || 'Parse failed')
        setXmlModal(prev => ({ ...prev, parsing: false }))
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Parse request failed')
      setXmlModal(prev => ({ ...prev, parsing: false }))
    }
  }

  const importFromXml = async () => {
    setXmlModal(prev => ({ ...prev, importing: true }))
    try {
      const request = buildXmlRequest()
      const res = await client.post('/tally/archive-xml', request.body, request.config)
      if (res.data && res.data.success) {
        setXmlModal(prev => ({ ...prev, importing: false, step: 'done', result: res.data }))
      } else {
        message.error(res.data?.message || 'Archive failed')
        setXmlModal(prev => ({ ...prev, importing: false }))
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Archive request failed')
      setXmlModal(prev => ({ ...prev, importing: false }))
    }
  }

  // ─── Fetch Dealers Options ───
  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const res = await client.get('/master/dealers-dropdown')
        if (res.data) {
          const list = Array.isArray(res.data) ? res.data : res.data.data || []
          setDealersOptions(list.map(d => ({ value: d.id || d.value, label: d.dealerName || d.label })))
        }
      } catch (err) {
        console.error('Error fetching dealers dropdown:', err)
      }
    }
    fetchDealers()
  }, [])

  // ─── Fetch Tally Entries ───
  const fetchTallyEntries = useCallback(async () => {
    if (!isAuditTab) return
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        sortField,
        sortOrder
      }
      if (selectedDealer) params.dealerId = selectedDealer
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }
      if (mainTab === 'inventory_in') {
        params.sourceType = '5'
        if (referenceType !== 'all') params.referenceType = referenceType
      } else if (sourceType !== 'all') {
        params.sourceType = sourceType
      }
      if (categoryClass !== 'all') params.categoryClass = categoryClass
      if (finishSpec !== 'all') params.finishSpec = finishSpec
      if (tallyStatusFilter !== 'all') params.tallyStatus = tallyStatusFilter
      if (searchQuery) params.search = searchQuery

      const res = await client.get('/entries/bill-tally', { params })
      if (res.data && res.data.success) {
        setEntries(res.data.data || [])
        setSummary(res.data.summary || {
          totalCount: 0, talliedCount: 0, needsAttentionCount: 0, untalliedCount: 0,
          totalQuantity: 0, talliedQuantity: 0, needsAttentionQuantity: 0, untalliedQuantity: 0
        })
        setTotalCount(res.data.totalCount || 0)
      }
    } catch (err) {
      console.error('Error fetching tally entries:', err)
      message.error('Failed to load bill tally entries')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, selectedDealer, dateRange, mainTab, sourceType, referenceType, categoryClass, finishSpec, tallyStatusFilter, searchQuery, sortField, sortOrder, isAuditTab])

  useEffect(() => {
    if (isAuditTab) fetchTallyEntries()
  }, [fetchTallyEntries, isAuditTab])

  // ─── Fetch Purchase / Stock / Sales Cost Ledgers ───
  const fetchCostLedger = useCallback(async () => {
    if (!costLedgerView) return
    setCostLedgerLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        status: costStatusFilter
      }
      if (searchQuery) params.search = searchQuery
      if (costLedgerView !== 'stock' && dateRange?.[0] && dateRange?.[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }

      const res = await client.get(`/cost-management/cost-ledger/${costLedgerView}`, { params })
      if (res.data?.success) {
        setCostLedgerRows(res.data.data || [])
        setCostLedgerSummary(res.data.summary || emptyCostLedgerSummary())
        setTotalCount(res.data.totalCount || 0)
      }
    } catch (err) {
      console.error(`Error fetching ${costLedgerView} cost ledger:`, err)
      message.error(err.response?.data?.message || `Failed to load ${costLedgerView} unit costs`)
    } finally {
      setCostLedgerLoading(false)
    }
  }, [costLedgerView, currentPage, pageSize, costStatusFilter, searchQuery, dateRange])

  useEffect(() => {
    if (costLedgerView) fetchCostLedger()
  }, [costLedgerView, fetchCostLedger])

  // ─── Update Tally Status / Note ───
  const handleUpdateStatus = async (item, newStatus, newNotes = undefined) => {
    try {
      const payload = {
        sourceType: item.sourceType,
        id: item.id,
        tallyStatus: newStatus
      }
      if (newNotes !== undefined) payload.tallyNotes = newNotes

      const res = await client.put('/entries/bill-tally/update', payload)
      if (res.data && res.data.success) {
        message.success(
          newStatus === 1
            ? 'Entry marked as Tallied & Verified ✓'
            : newStatus === 2
              ? 'Flagged for Attention ⚠️'
              : 'Entry set to Untallied'
        )
        setEntries(prev =>
          prev.map(row => {
            if (row.id === item.id && row.sourceType === item.sourceType) {
              return {
                ...row,
                tallyStatus: newStatus,
                tallyNotes: newNotes !== undefined ? newNotes : row.tallyNotes,
                talliedAt: new Date().toISOString()
              }
            }
            return row
          })
        )
        fetchTallyEntries()
      }
    } catch (err) {
      console.error('Error updating tally status:', err)
      message.error('Failed to update tally status')
    }
  }

  // ─── Open Note Modal ───
  const openNoteModal = (item) => {
    setNoteModal({
      open: true,
      item,
      status: item.tallyStatus || 0,
      notes: item.tallyNotes || ''
    })
  }

  // ─── Save Note Modal ───
  const saveNoteModal = async () => {
    if (!noteModal.item) return
    setUpdating(true)
    try {
      await handleUpdateStatus(noteModal.item, noteModal.status, noteModal.notes)
      setNoteModal({ open: false, item: null, status: 0, notes: '' })
    } finally {
      setUpdating(false)
    }
  }

  const isRawFinishProduct = value => /without\s+(paint|lacquer)|unpainted|raw\s+finish|\braw\b/i.test(String(value || ''))
  const isFinishedFinishProduct = value => {
    const productName = String(value || '').trim()
    return /\bPY[-\s]?\d+/i.test(productName) && !isRawFinishProduct(productName)
  }

  // ─── Raw / Finished Finish Costing Flow: Open Calculator ───
  const openRawFinishCostingModal = async (row) => {
    const rowSourceType = Number(row.sourceType)
    const isInventoryIn = rowSourceType === 5
    const isRawFinish = isRawFinishProduct(row.description)
    const isFinishedFinish = (rowSourceType === 1 || isInventoryIn) && isFinishedFinishProduct(row.description)
    const isSupportedEntry = (rowSourceType === 1 || isInventoryIn) && (isRawFinish || isFinishedFinish)
    if (!isSupportedEntry) {
      return message.warning('Costing is available only for raw-finish or finished-finish wheel sales and raw-finish Inventory In rows')
    }

    const entryType = isInventoryIn
      ? isFinishedFinish ? 'finished-inventory-in' : 'inventory-in'
      : isFinishedFinish ? 'finished-sales' : 'sales'
    const matchPath = isInventoryIn
      ? isFinishedFinish
        ? `/cost-management/raw-finish/finished/inventory-in/match-purchases/${row.id}`
        : `/cost-management/raw-finish/inventory-in/match-purchases/${row.id}`
      : isFinishedFinish
        ? `/cost-management/raw-finish/finished/match-purchases/${row.id}`
        : `/cost-management/raw-finish/match-purchases/${row.id}`

    setCostingModal({
      open: true,
      loading: true,
      stamping: false,
      entryType,
      entryDetails: null,
      purchaseSource: 'none',
      productionCandidates: [],
      productionSources: [],
      matchedPurchases: [],
      remainingUnmatchedQty: 0,
      unitCosts: {}
    })
    try {
      const res = await client.get(matchPath)
      if (res.data && res.data.success) {
        const purchases = res.data.matchedPurchases || []
        const initialCosts = {}
        purchases.forEach(p => {
          // Reuse a unit cost previously stamped onto this Tally line. If it
          // has never been manually costed, require the operator to enter it.
          initialCosts[p.purchaseId] = p.costingUnitCost ?? null
        })
        setCostingModal({
          open: true,
          loading: false,
          stamping: false,
          entryType,
          entryDetails: res.data.entryDetails,
          purchaseSource: res.data.source || 'none',
          productionCandidates: res.data.productionCandidates || [],
          productionSources: res.data.productionSources || [],
          matchedPurchases: purchases,
          remainingUnmatchedQty: res.data.remainingUnmatchedQty || 0,
          unitCosts: initialCosts
        })
      }
    } catch (err) {
      console.error('Error fetching finish costing matches:', err)
      message.error(err.response?.data?.message || 'Failed to resolve finish costing inputs')
      setCostingModal(prev => ({ ...prev, loading: false }))
    }
  }

  // ─── Raw Finish Costing Flow: Realtime Weighted Average Calculation ───
  const modalCalculations = useMemo(() => {
    if (!costingModal.matchedPurchases || costingModal.matchedPurchases.length === 0) {
      return { weightedAvgCost: 0, totalCost: 0 }
    }
    let totalCostSum = 0
    let totalQtySum = 0
    costingModal.matchedPurchases.forEach(p => {
      const q = Number(p.matchedQty) || 0
      const c = Number(costingModal.unitCosts[p.purchaseId]) || 0
      totalCostSum += q * c
      totalQtySum += q
    })
    const weightedAvgCost = totalQtySum > 0 ? Math.round((totalCostSum / totalQtySum) * 100) / 100 : 0
    return {
      weightedAvgCost,
      totalCost: Math.round(totalCostSum * 100) / 100
    }
  }, [costingModal.matchedPurchases, costingModal.unitCosts])
  const hasMissingUnitCosts = useMemo(() => (
    costingModal.matchedPurchases.length === 0 ||
    costingModal.matchedPurchases.some(p => {
      const value = costingModal.unitCosts[p.purchaseId]
      return value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) || Number(value) < 0
    })
  ), [costingModal.matchedPurchases, costingModal.unitCosts])


  // ─── Raw / Finished Finish Costing Flow: Save & Stamp Costing ───
  const saveRawFinishCosting = async () => {
    if (!costingModal.entryDetails) return
    if (hasMissingUnitCosts) {
      message.warning('Enter a unit cost for every matched purchase before stamping')
      return
    }
    setCostingModal(prev => ({ ...prev, stamping: true }))
    try {
      const purchasesPayload = costingModal.matchedPurchases.map(p => ({
        purchaseId: p.purchaseId,
        date: p.date,
        dealerName: p.dealerName,
        productName: p.productName,
        matchedQty: p.matchedQty,
        unitCost: Number(costingModal.unitCosts[p.purchaseId]) || 0,
        source: p.source || costingModal.purchaseSource,
        productionId: p.productionId,
        productionIds: p.productionIds,
        productionDate: p.productionDate,
        rawProductId: p.rawProductId,
        rawProductName: p.rawProductName
      }))
      const isFinishedFinish = costingModal.entryType === 'finished-sales' || costingModal.entryType === 'finished-inventory-in'
      const isInventoryMovement = costingModal.entryType === 'inventory-in' || costingModal.entryType === 'finished-inventory-in'
      const stampPath = isInventoryMovement
        ? '/cost-management/raw-finish/inventory-in/stamp-costing'
        : '/cost-management/raw-finish/stamp-costing'
      const stampPayload = isInventoryMovement
        ? {
            movementId: costingModal.entryDetails.entryId,
            purchases: purchasesPayload,
            purchaseSource: costingModal.purchaseSource,
            workflowType: isFinishedFinish ? 'finished-finish' : 'raw-finish',
            productionSources: isFinishedFinish ? costingModal.productionSources : []
          }
        : {
            entryId: costingModal.entryDetails.entryId,
            purchases: purchasesPayload,
            purchaseSource: costingModal.purchaseSource,
            workflowType: isFinishedFinish ? 'finished-finish' : 'raw-finish',
            productionSources: isFinishedFinish ? costingModal.productionSources : []
          }

      const res = await client.post(stampPath, stampPayload)

      if (res.data && res.data.success) {
        message.success(res.data.message || (isFinishedFinish
          ? 'Finished finish costing calculated and stamped successfully!'
          : 'Raw finish costing calculated and stamped successfully!'))
        setCostingModal({ open: false, loading: false, stamping: false, entryType: 'sales', entryDetails: null, purchaseSource: 'none', productionCandidates: [], productionSources: [], matchedPurchases: [], remainingUnmatchedQty: 0, unitCosts: {} })
        fetchTallyEntries()
      }
    } catch (err) {
      console.error('Error stamping finish costing:', err)
      message.error(err.response?.data?.message || 'Failed to stamp finish costing')
    } finally {
      setCostingModal(prev => ({ ...prev, stamping: false }))
    }
  }

  // ─── Helper Badge Renders ───
  const renderSourceTag = (sourceType, source) => {
    switch (Number(sourceType)) {
      case 1:
        return <Tag color="blue" style={{ borderRadius: 12, fontWeight: 500 }}>Outwards Sale</Tag>
      case 2:
        return <Tag color="green" style={{ borderRadius: 12, fontWeight: 500 }}>Payment</Tag>
      case 3:
        return <Tag color="purple" style={{ borderRadius: 12, fontWeight: 500 }}>Inwards Purchase</Tag>
      case 4:
        return <Tag color="gold" style={{ borderRadius: 12, fontWeight: 500 }}>Charge</Tag>
      case 5:
        return <Tag color="cyan" style={{ borderRadius: 12, fontWeight: 500 }}>Inventory In</Tag>
      default:
        return <Tag color="default">{source}</Tag>
    }
  }

  const renderStatusBadge = (status) => {
    switch (Number(status)) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircleOutlined /> Tallied & Verified
          </span>
        )
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ExclamationCircleOutlined /> Needs Attention
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            <ClockCircleOutlined /> Untallied
          </span>
        )
    }
  }

  const talliedPercent = summary.totalCount > 0
    ? Math.round((summary.talliedCount / summary.totalCount) * 100)
    : 0
  const isFinishedFinishCosting = costingModal.entryType === 'finished-sales' || costingModal.entryType === 'finished-inventory-in'
  const isInventoryFinishCosting = costingModal.entryType === 'inventory-in' || costingModal.entryType === 'finished-inventory-in'
  const activeLoading = costLedgerView ? costLedgerLoading : loading
  const costLedgerTitle = costLedgerView === 'purchases'
    ? 'Purchase Cost Per Unit'
    : costLedgerView === 'stock'
      ? 'Current Stock Cost Per Unit'
      : 'Sales Cost Per Unit'
  const costLedgerReferenceLabel = costLedgerView === 'purchases'
    ? 'Voucher'
    : costLedgerView === 'stock'
      ? 'Location'
      : 'Sale'
  const costLedgerCounterpartyLabel = costLedgerView === 'purchases'
    ? 'Supplier / Party'
    : costLedgerView === 'stock'
      ? 'Product Type'
      : 'Dealer'
  const refreshActiveData = () => {
    if (costLedgerView) fetchCostLedger()
    else fetchTallyEntries()
  }

  return (
    <div style={{ width: '100%', fontFamily: FONT, color: INK }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <PageTitle>🧾 Physical Bill Verification & Tally Desk</PageTitle>
          <div style={{ color: MUTED, fontSize: 13.5, marginTop: 4 }}>
            Tally physical paper bills, dealer invoices, inwards purchases, payments & inventory stock receipts. Flag price/qty mismatches and attach auditor notes.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tooltip title={tallyServer.message || 'Tally ERP 9 Connection Status'}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{
              background: tallyServer.online ? '#ecfdf5' : '#fef2f2',
              color: tallyServer.online ? '#047857' : '#b91c1c',
              border: `1px solid ${tallyServer.online ? '#a7f3d0' : '#fecdd3'}`
            }}>
              <span className={`w-2 h-2 rounded-full ${tallyServer.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {tallyServer.online ? `🟢 Tally ERP 9 Online (${tallyServer.host}:${tallyServer.port})` : `🔴 Tally ERP 9 Offline (${tallyServer.host}:${tallyServer.port})`}
              {tallyServer.companies.length > 0 ? ` · ${tallyServer.companies[0]}` : ''}
            </div>
          </Tooltip>

          <button
            onClick={syncTallyVouchers}
            disabled={syncingTally || !tallyServer.online}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: ORANGE, border: 'none', borderRadius: 999,
              padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'white',
              cursor: (syncingTally || !tallyServer.online) ? 'not-allowed' : 'pointer',
              opacity: tallyServer.online ? 1 : 0.6
            }}
          >
            <ReloadOutlined spin={syncingTally} /> {syncingTally ? 'Syncing Tally…' : 'Sync Tally Vouchers'}
          </button>
          <Tooltip title="No live Tally connection? Export XML from Tally Day Book and paste it here.">
            <button
              onClick={() => setXmlModal({ open: true, step: 'paste', xml: '', file: null, parsing: false, importing: false, preview: null, result: null })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#1e1b4b', border: 'none', borderRadius: 999,
                padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'white',
                cursor: 'pointer'
              }}
            >
              <CodeOutlined /> Paste XML
            </button>
          </Tooltip>
          <button
            onClick={refreshActiveData}
            disabled={activeLoading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#f0f2f5', border: `1px solid ${BORDER}`, borderRadius: 999,
              padding: '8px 16px', fontSize: 13.5, fontWeight: 500, color: INK,
              cursor: 'pointer'
            }}
          >
            <ReloadOutlined spin={activeLoading} /> Refresh Data
          </button>
        </div>
      </div>

      {/* ─── Main Section Navigation Tabs ─── */}
      <div style={{ display: 'flex', gap: 8, borderBottom: `2px solid ${BORDER}`, marginBottom: 20, overflowX: 'auto' }}>
        {MAIN_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setMainTab(tab.id)
              if (tab.id === 'bills') setSourceType('all')
              if (tab.id === 'inventory_in') setSourceType('5')
              setCurrentPage(1)
            }}
            style={{
              padding: '12px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              border: 'none', background: 'transparent', whiteSpace: 'nowrap',
              borderBottom: mainTab === tab.id ? `3px solid ${ORANGE}` : '3px solid transparent',
              color: mainTab === tab.id ? ORANGE : INK,
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isAuditTab ? (
        <>
      {/* ─── KPI Summary Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Audit Items
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: INK, marginTop: 4 }}>
            {summary.totalCount.toLocaleString('en-IN')}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: MUTED }}>({(summary.totalQuantity || 0).toLocaleString('en-IN')} units)</span>
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
            Filtered transactions ready for tally
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #a7f3d0', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Tallied & Verified ✓
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#065f46', marginTop: 4 }}>
            {summary.talliedCount.toLocaleString('en-IN')}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: '#047857' }}>({(summary.talliedQuantity || 0).toLocaleString('en-IN')} units · {talliedPercent}%)</span>
          </div>
          <div className="w-full bg-emerald-100 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-600 h-2 rounded-full transition-all duration-300" style={{ width: `${talliedPercent}%` }} />
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #fecdd3', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#be123c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Needs Attention ⚠️
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#9f1239', marginTop: 4 }}>
            {summary.needsAttentionCount.toLocaleString('en-IN')}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: '#be123c' }}>({(summary.needsAttentionQuantity || 0).toLocaleString('en-IN')} units)</span>
          </div>
          <div style={{ fontSize: 12, color: '#be123c', marginTop: 4 }}>
            Discrepancies flagged for follow-up
          </div>
        </div>

        <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Untallied / Pending
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: INK, marginTop: 4 }}>
            {summary.untalliedCount.toLocaleString('en-IN')}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: MUTED }}>({(summary.untalliedQuantity || 0).toLocaleString('en-IN')} units)</span>
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
            Awaiting physical bill match
          </div>
        </div>
      </div>

      {/* ─── Control Bar (Filters) ─── */}
      <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: 20, padding: 16, marginBottom: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>DEALER FILTER</div>
            <Select
              showSearch
              allowClear
              placeholder="All Dealers"
              style={{ width: '100%' }}
              value={selectedDealer}
              onChange={(val) => { setSelectedDealer(val); setCurrentPage(1) }}
              options={dealersOptions}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>FINISH SPECIFICATION</div>
            <Select
              style={{ width: '100%' }}
              value={finishSpec}
              onChange={(val) => { setFinishSpec(val); setCurrentPage(1) }}
              options={[
                { value: 'all', label: 'All Wheel Finishes' },
                { value: 'raw_finish', label: '🛠️ Raw Finish (Black Without Lacquer / Paint)' },
                { value: 'lacquered', label: '🎨 Painted & Lacquered' }
              ]}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>PRODUCT CATEGORY</div>
            <Select
              style={{ width: '100%' }}
              value={categoryClass}
              onChange={(val) => { setCategoryClass(val); setCurrentPage(1) }}
              options={[
                { value: 'all', label: 'All Items & Materials' },
                { value: 'finished', label: '✨ Finished Goods (Alloys, Tyres, Caps, PPF)' },
                { value: 'raw', label: '🧱 Raw Materials & Scrap' }
              ]}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>BILL DATE RANGE</div>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => { setDateRange(dates); setCurrentPage(1) }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>TALLY STATUS</div>
            <Select
              style={{ width: '100%' }}
              value={tallyStatusFilter}
              onChange={(val) => { setTallyStatusFilter(val); setCurrentPage(1) }}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: '0', label: '⏳ Untallied' },
                { value: '1', label: '✓ Tallied & Verified' },
                { value: '2', label: '⚠️ Needs Attention' }
              ]}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>SORT BY</div>
            <Select
              style={{ width: '100%' }}
              value={`${sortField}_${sortOrder}`}
              onChange={(val) => {
                const [f, o] = val.split('_')
                setSortField(f)
                setSortOrder(o)
                setCurrentPage(1)
              }}
              options={[
                { value: 'date_desc', label: '📅 Date (Newest First)' },
                { value: 'date_asc', label: '📅 Date (Oldest First)' },
                { value: 'quantity_desc', label: '📦 Quantity (High → Low)' },
                { value: 'quantity_asc', label: '📦 Quantity (Low → High)' },
                { value: 'amount_desc', label: '💰 Amount (High → Low)' },
                { value: 'amount_asc', label: '💰 Amount (Low → High)' },
                { value: 'dealerName_asc', label: '🏢 Dealer (A → Z)' },
                { value: 'dealerName_desc', label: '🏢 Dealer (Z → A)' },
                { value: 'tallyStatus_desc', label: '⚠️ Needs Attention First' },
                { value: 'tallyStatus_asc', label: '✓ Tallied First' }
              ]}
            />
          </div>
        </div>

        {/* Sub-Filters: Transaction Type (on Bills tab) or Reference Type (on Inventory In tab) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginRight: 4 }}>
            {mainTab === 'inventory_in' ? 'INWARD MOVEMENT TYPE:' : 'TRANSACTION TYPE:'}
          </span>
          {mainTab === 'inventory_in' ? (
            [
              { id: 'all', label: 'All Inward Types' },
              { id: 'production_request', label: '🏭 Production Acceptance' },
              { id: 'dispatch_entry_delete', label: '📦 Dispatch Restored' },
              { id: 'purchase', label: '📥 Inward Purchase' },
              { id: 'adjustment', label: '⚙️ Stock Adjustment' },
              { id: 'sales_entry_edit', label: '✏️ Sales Entry Edited' },
              { id: 'pricing_entry_delete', label: '💰 Pricing Deleted' },
              { id: 'rework_return', label: '🔄 Rework Return' },
              { id: 'sync', label: '🔄 Stock Sync' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setReferenceType(tab.id); setCurrentPage(1) }}
                style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                  border: referenceType === tab.id ? 'none' : `1px solid ${BORDER}`,
                  background: referenceType === tab.id ? ORANGE : 'white',
                  color: referenceType === tab.id ? 'white' : INK,
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))
          ) : (
            [
              { id: 'all', label: 'All Types' },
              { id: '1', label: '📦 Sales (Outwards)' },
              { id: '3', label: '📥 Purchases (Inwards)' },
              { id: '2', label: '💳 Payments' },
              { id: '4', label: '🏷️ Charges' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setSourceType(tab.id); setCurrentPage(1) }}
                style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                  border: sourceType === tab.id ? 'none' : `1px solid ${BORDER}`,
                  background: sourceType === tab.id ? ORANGE : 'white',
                  color: sourceType === tab.id ? 'white' : INK,
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ─── Tally Table ─── */}
      <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>
                <th
                  onClick={() => { setSortField('date'); setSortOrder(sortField === 'date' && sortOrder === 'desc' ? 'asc' : 'desc'); setCurrentPage(1) }}
                  style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: sortField === 'date' ? ORANGE : MUTED, width: 130, cursor: 'pointer' }}
                >
                  Date & Type {sortField === 'date' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th
                  onClick={() => { setSortField('dealerName'); setSortOrder(sortField === 'dealerName' && sortOrder === 'asc' ? 'desc' : 'asc'); setCurrentPage(1) }}
                  style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: sortField === 'dealerName' ? ORANGE : MUTED, width: 170, cursor: 'pointer' }}
                >
                  {mainTab === 'inventory_in' ? 'Ref Type / Target' : 'Dealer'} {sortField === 'dealerName' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: MUTED }}>Particulars / Product / Bill Item</th>
                <th
                  onClick={() => { setSortField('quantity'); setSortOrder(sortField === 'quantity' && sortOrder === 'desc' ? 'asc' : 'desc'); setCurrentPage(1) }}
                  style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: sortField === 'quantity' ? ORANGE : MUTED, width: 110, cursor: 'pointer' }}
                >
                  Qty (Units) {sortField === 'quantity' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th
                  onClick={() => { setSortField('amount'); setSortOrder(sortField === 'amount' && sortOrder === 'desc' ? 'asc' : 'desc'); setCurrentPage(1) }}
                  style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: sortField === 'amount' ? ORANGE : MUTED, width: 120, cursor: 'pointer' }}
                >
                  Amount (₹) {sortField === 'amount' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th
                  onClick={() => { setSortField('tallyStatus'); setSortOrder(sortField === 'tallyStatus' && sortOrder === 'desc' ? 'asc' : 'desc'); setCurrentPage(1) }}
                  style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: sortField === 'tallyStatus' ? ORANGE : MUTED, width: 160, cursor: 'pointer' }}
                >
                  Tally Status {sortField === 'tallyStatus' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: MUTED, width: 220 }}>Auditor Notes</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: MUTED, width: 170 }}>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: ORANGE, fontWeight: 500 }}>
                    Loading physical bill tally data...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: MUTED, fontWeight: 500 }}>
                    No entries match your tally filter criteria.
                  </td>
                </tr>
              ) : (
                entries.map(row => (
                  <tr
                    key={`${row.sourceType}-${row.id}`}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: Number(row.tallyStatus) === 2 ? '#fff1f2' : Number(row.tallyStatus) === 1 ? '#f0fdf4' : 'transparent',
                      transition: 'background 0.15s'
                    }}
                  >
                    {/* Date & Source */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 500, color: INK }}>
                        {row.date ? moment(row.date).format('DD MMM YYYY') : '—'}
                      </div>
                      <div style={{ marginTop: 2 }}>
                        {renderSourceTag(row.sourceType, row.source)}
                      </div>
                    </td>

                    {/* Dealer / Target */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontWeight: 500, color: INK }}>
                      {row.dealerName || '—'}
                    </td>

                    {/* Description / Product */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 500, color: INK }}>
                        {row.description || '—'}
                      </div>
                      {row.transportationCharges > 0 ? (
                        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                          Transport: ₹{row.transportationCharges}
                        </div>
                      ) : null}
                    </td>

                    {/* Quantity Column */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {row.quantity || 0} Pcs
                      </span>
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right', fontWeight: 600, fontSize: 14, color: INK }}>
                      ₹{getBillTallyAmount(row).toLocaleString('en-IN')}
                    </td>

                    {/* Tally Status */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                      {renderStatusBadge(row.tallyStatus)}
                    </td>

                    {/* Auditor Notes */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      {row.tallyNotes ? (
                        <div style={{ fontSize: 12.5, color: Number(row.tallyStatus) === 2 ? '#9f1239' : INK, background: 'rgba(255,255,255,0.7)', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)' }}>
                          📝 {row.tallyNotes}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: MUTED, italic: 'true' }}>No note attached</span>
                      )}
                    </td>

                    {/* Quick Actions */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <Tooltip title="Mark as Tallied & Verified ✓">
                          <button
                            onClick={() => handleUpdateStatus(row, 1)}
                            style={{
                              padding: '4px 10px', borderRadius: 8, border: 'none',
                              background: Number(row.tallyStatus) === 1 ? '#10b981' : '#e2e8f0',
                              color: Number(row.tallyStatus) === 1 ? 'white' : INK,
                              fontSize: 12, fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            ✓
                          </button>
                        </Tooltip>

                        <Tooltip title="Flag for Attention ⚠️">
                          <button
                            onClick={() => handleUpdateStatus(row, 2)}
                            style={{
                              padding: '4px 10px', borderRadius: 8, border: 'none',
                              background: Number(row.tallyStatus) === 2 ? '#f43f5e' : '#e2e8f0',
                              color: Number(row.tallyStatus) === 2 ? 'white' : INK,
                              fontSize: 12, fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            ⚠️
                          </button>
                        </Tooltip>

                        <Tooltip title="Add / Edit Note 📝">
                          <button
                            onClick={() => openNoteModal(row)}
                            style={{
                              padding: '4px 10px', borderRadius: 8, border: `1px solid ${BORDER}`,
                              background: 'white', color: INK,
                              fontSize: 12, fontWeight: 500, cursor: 'pointer'
                            }}
                          >
                            <EditOutlined />
                          </button>
                        </Tooltip>

                        {/* Raw / Finished Finish Costing Calculator Button */}
                        {((Number(row.sourceType) === 1 || Number(row.sourceType) === 5) && isRawFinishProduct(row.description)) && (
                          <Tooltip title="Calculate & Stamp Raw Finish Wheel Costing 🧮">
                            <button
                              onClick={() => openRawFinishCostingModal(row)}
                              style={{
                                padding: '4px 10px', borderRadius: 8, border: 'none',
                                background: '#7c3aed', color: 'white',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer'
                              }}
                            >
                              <CalculatorOutlined />
                            </button>
                          </Tooltip>
                        )}
                        {(Number(row.sourceType) === 1 || Number(row.sourceType) === 5) && isFinishedFinishProduct(row.description) && (
                          <Tooltip title="Calculate & Stamp Finished Finish Wheel Costing 🧮">
                            <button
                              onClick={() => openRawFinishCostingModal(row)}
                              style={{
                                padding: '4px 10px', borderRadius: 8, border: 'none',
                                background: '#0f766e', color: 'white',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer'
                              }}
                            >
                              <CalculatorOutlined />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <DataTablePagination
          currentPage={currentPage}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        />
      </div>
        </>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: MUTED, textTransform: 'uppercase' }}>Total Records</div>
              <div style={{ fontSize: 25, fontWeight: 800, marginTop: 4 }}>{Number(costLedgerSummary.totalRows || 0).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 12, color: MUTED }}>{Number(costLedgerSummary.totalQuantity || 0).toLocaleString('en-IN')} total pieces</div>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Cost Available</div>
              <div style={{ fontSize: 25, fontWeight: 800, color: '#065f46', marginTop: 4 }}>{Number(costLedgerSummary.costedRows || 0).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 12, color: '#047857' }}>Rows with cost per unit</div>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Awaiting Cost</div>
              <div style={{ fontSize: 25, fontWeight: 800, color: '#92400e', marginTop: 4 }}>{Number(costLedgerSummary.pendingRows || 0).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 12, color: '#b45309' }}>Rows without a unit cost</div>
            </div>
            <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase' }}>Recorded Cost Value</div>
              <div style={{ fontSize: 25, fontWeight: 800, color: '#6b21a8', marginTop: 4 }}>₹{Number(costLedgerSummary.totalValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              <div style={{ fontSize: 12, color: '#7e22ce' }}>Quantity × cost per unit</div>
            </div>
          </div>

          <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: 18, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>{costLedgerTitle}</div>
                <div style={{ color: MUTED, fontSize: 12.5, marginTop: 3 }}>
                  {costLedgerView === 'purchases' && 'Every archived Tally purchase line, including costed and pending purchases.'}
                  {costLedgerView === 'stock' && 'Current on-hand internal inventory with its carried cost per unit.'}
                  {costLedgerView === 'sales' && 'Alloy sales only, with the cost per unit carried at the time of sale.'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <Input
                  allowClear
                  prefix={<SearchOutlined style={{ color: MUTED }} />}
                  placeholder="Search product, party or reference"
                  value={costSearchDraft}
                  onChange={e => {
                    const value = e.target.value
                    setCostSearchDraft(value)
                    if (!value) { setSearchQuery(''); setCurrentPage(1) }
                  }}
                  onPressEnter={() => { setSearchQuery(costSearchDraft.trim()); setCurrentPage(1) }}
                  style={{ width: 280 }}
                />
                <button
                  onClick={() => { setSearchQuery(costSearchDraft.trim()); setCurrentPage(1) }}
                  style={{ border: 'none', borderRadius: 8, background: ORANGE, color: 'white', padding: '7px 13px', cursor: 'pointer', fontWeight: 600 }}
                >Search</button>
                {costLedgerView !== 'stock' && (
                  <RangePicker
                    value={dateRange}
                    onChange={dates => { setDateRange(dates); setCurrentPage(1) }}
                  />
                )}
                <Select
                  value={costStatusFilter}
                  onChange={value => { setCostStatusFilter(value); setCurrentPage(1) }}
                  style={{ width: 165 }}
                  options={[
                    { value: 'all', label: 'All Cost Statuses' },
                    { value: 'costed', label: '✓ Cost Available' },
                    { value: 'pending', label: '⏳ Awaiting Cost' }
                  ]}
                />
              </div>
            </div>
          </div>

          <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: MUTED, fontWeight: 600, whiteSpace: 'nowrap' }}>{costLedgerView === 'stock' ? 'Last Updated' : 'Date'}</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: MUTED, fontWeight: 600 }}>{costLedgerReferenceLabel}</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: MUTED, fontWeight: 600 }}>{costLedgerCounterpartyLabel}</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: MUTED, fontWeight: 600 }}>Product</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', color: MUTED, fontWeight: 600 }}>Quantity</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', color: MUTED, fontWeight: 600 }}>Cost Per Unit</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', color: MUTED, fontWeight: 600 }}>{costLedgerView === 'stock' ? 'Stock Value' : 'Total Cost'}</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', color: MUTED, fontWeight: 600 }}>Cost Status</th>
                  </tr>
                </thead>
                <tbody>
                  {costLedgerLoading ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 42, color: ORANGE, fontWeight: 600 }}>Loading {costLedgerView} cost data...</td></tr>
                  ) : costLedgerRows.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 42, color: MUTED }}>No cost records match the selected filters.</td></tr>
                  ) : costLedgerRows.map(row => (
                    <tr key={`${costLedgerView}-${row.id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{row.date ? moment(row.date).format('DD MMM YYYY') : '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{row.reference || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{costLedgerView === 'stock' ? row.productType || '—' : row.counterparty || '—'}</td>
                      <td style={{ padding: '12px 14px', minWidth: 250 }}>
                        <div style={{ fontWeight: 600, color: INK }}>{row.productName || '—'}</div>
                        <div style={{ color: MUTED, fontSize: 11.5, marginTop: 2 }}>{row.uniqueId || row.source || ''}</div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700 }}>{Number(row.quantity || 0).toLocaleString('en-IN')} Pcs</div>
                        {costLedgerView === 'purchases' && <div style={{ color: MUTED, fontSize: 11.5 }}>{Number(row.remainingQuantity || 0).toLocaleString('en-IN')} remaining</div>}
                        {costLedgerView === 'stock' && <div style={{ color: MUTED, fontSize: 11.5 }}>{Number(row.availableQuantity || 0).toLocaleString('en-IN')} available · {Number(row.reservedQuantity || 0).toLocaleString('en-IN')} reserved</div>}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {row.costPerUnit == null
                          ? <span style={{ color: '#b45309', fontWeight: 600 }}>— Pending</span>
                          : <span style={{ fontSize: 15, fontWeight: 800, color: '#6b21a8' }}>₹{Number(row.costPerUnit).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {row.totalCost == null ? '—' : <strong>₹{Number(row.totalCost).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>}
                        {costLedgerView === 'sales' && <div style={{ color: MUTED, fontSize: 11.5 }}>Revenue ₹{Number(row.revenue || 0).toLocaleString('en-IN')}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {row.costStatus === 'costed'
                          ? <Tag color="green" style={{ borderRadius: 999, fontWeight: 600 }}>✓ Costed</Tag>
                          : <Tag color="gold" style={{ borderRadius: 999, fontWeight: 600 }}>⏳ Pending</Tag>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DataTablePagination
              currentPage={currentPage}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
            />
          </div>
        </div>
      )}

      {/* ─── Note & Status Modal ─── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: ORANGE }} />
            <span>Auditor Tally Note & Verification Status</span>
          </div>
        }
        open={noteModal.open}
        onCancel={() => setNoteModal({ open: false, item: null, status: 0, notes: '' })}
        onOk={saveNoteModal}
        confirmLoading={updating}
        okText="Save Tally Note"
        okButtonProps={{ style: { background: ORANGE, border: 'none', borderRadius: 999 } }}
        cancelButtonProps={{ style: { borderRadius: 999 } }}
      >
        {noteModal.item && (
          <div style={{ fontFamily: FONT, paddingTop: 8 }}>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 12, border: `1px solid ${BORDER}`, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: INK, fontSize: 14 }}>
                {noteModal.item.dealerName} — {noteModal.item.description}
              </div>
              <div style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>
                {noteModal.item.source} dated {noteModal.item.date ? moment(noteModal.item.date).format('DD MMM YYYY') : 'N/A'} · Qty: <strong>{noteModal.item.quantity || 0} Pcs</strong> · Amount: <strong>₹{getBillTallyAmount(noteModal.item).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: INK, marginBottom: 6 }}>TALLY STATUS:</div>
              <Select
                style={{ width: '100%' }}
                value={noteModal.status}
                onChange={(val) => setNoteModal(prev => ({ ...prev, status: val }))}
                options={[
                  { value: 0, label: '⏳ Untallied (Default)' },
                  { value: 1, label: '✓ Tallied & Verified (Paper bill matches entry)' },
                  { value: 2, label: '⚠️ Needs Attention (Discrepancy / Mismatch flagged)' }
                ]}
              />
            </div>

            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: INK, marginBottom: 6 }}>AUDITOR NOTES / DISCREPANCY DETAILS:</div>
              <TextArea
                rows={4}
                placeholder="E.g., Invoice #1094 says price ₹5,400 but entry is ₹5,784. Transport charge ₹650 missing on paper bill."
                value={noteModal.notes}
                onChange={(e) => setNoteModal(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Raw / Finished Finish Costing Flow Modal ─── */}
      <Modal
        width={800}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalculatorOutlined style={{ color: isFinishedFinishCosting ? '#0f766e' : '#7c3aed', fontSize: 18 }} />
            <span>{isFinishedFinishCosting
              ? '🧮 Finished Finish Costing Flow (Production → Raw Finish → Purchases)'
              : '🧮 Raw Finish Costing Flow (Latest to Oldest Purchases)'}</span>
          </div>
        }
        open={costingModal.open}
        onCancel={() => setCostingModal({ open: false, loading: false, stamping: false, entryType: 'sales', entryDetails: null, purchaseSource: 'none', productionCandidates: [], productionSources: [], matchedPurchases: [], remainingUnmatchedQty: 0, unitCosts: {} })}
        onOk={saveRawFinishCosting}
        confirmLoading={costingModal.stamping}
        okText="Save & Stamp Entry Costing"
        okButtonProps={{
          disabled: costingModal.loading || costingModal.remainingUnmatchedQty > 0 || hasMissingUnitCosts,
          style: { background: isFinishedFinishCosting ? '#0f766e' : '#7c3aed', border: 'none', borderRadius: 999 }
        }}
        cancelButtonProps={{ style: { borderRadius: 999 } }}
      >
        {costingModal.loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#7c3aed', fontWeight: 500 }}>
            {isFinishedFinishCosting
              ? 'Resolving completed productions, raw finishes, and prior Tally purchases...'
              : 'Fetching prior purchases from latest to oldest...'}
          </div>
        ) : costingModal.entryDetails ? (
          <div style={{ fontFamily: FONT, paddingTop: 8 }}>
            {/* Step 1: Entry Info Banner */}
            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {isInventoryFinishCosting
                      ? isFinishedFinishCosting
                        ? 'STEP 1: FINISHED FINISH INVENTORY IN DETAILS'
                        : 'STEP 1: RAW FINISH INVENTORY IN DETAILS'
                      : isFinishedFinishCosting
                        ? 'STEP 1: FINISHED FINISH ENTRY DETAILS'
                        : 'STEP 1: RAW FINISH SALES ENTRY DETAILS'}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginTop: 2 }}>
                    {costingModal.entryDetails.productName}
                  </div>
                  <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>
                    Date: <strong>{moment(costingModal.entryDetails.date).format('DD MMM YYYY')}</strong> · Entry Qty Needed: <strong style={{ color: '#7c3aed', fontSize: 14 }}>{costingModal.entryDetails.quantity} Pcs</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#6d28d9', marginTop: 4 }}>
                    {isFinishedFinishCosting ? 'Raw purchase source' : 'Purchase source'}: <strong>{rawCostingSourceLabels[costingModal.purchaseSource] || 'Unavailable'}</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: MUTED }}>{isInventoryFinishCosting ? 'CURRENT ENTRY COST' : 'SALE PRICE / REVENUE'}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: INK }}>
                    {isInventoryFinishCosting
                      ? costingModal.entryDetails.currentUnitCost != null
                        ? `₹${Number(costingModal.entryDetails.currentUnitCost).toLocaleString('en-IN')} / piece`
                        : '—'
                      : `₹${Number(costingModal.entryDetails.totalPrice || 0).toLocaleString('en-IN')}`}
                  </div>
                </div>
              </div>
            </div>
            {costingModal.remainingUnmatchedQty > 0 && (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 12px', marginBottom: 14, color: '#9a3412', fontSize: 13 }}>
                <WarningOutlined /> {(rawCostingSourceLabels[costingModal.purchaseSource] || 'Prior cost sources')} cover only {Number(costingModal.entryDetails.quantity) - Number(costingModal.remainingUnmatchedQty)} of {costingModal.entryDetails.quantity} Pcs. {costingModal.remainingUnmatchedQty} Pcs remain unmatched, so stamping is disabled.
              </div>
            )}

            {isFinishedFinishCosting && costingModal.productionCandidates.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: INK, marginBottom: 8 }}>
                  STEP 2: PRODUCTIONS BEFORE ENTRY TIMESTAMP (LATEST TO OLDEST)
                </div>
                <div style={{ fontSize: 12, color: '#0f766e', marginBottom: 8 }}>
                  {isInventoryFinishCosting
                    ? 'The incoming quantity is allocated across completed production output for lineage, latest to oldest. Each production points to the raw finish consumed to create it.'
                    : 'The entry quantity is allocated across currently available completed production output, latest to oldest. Each production points to the raw finish consumed to create it.'}
                </div>
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'auto', maxHeight: 260 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: '#f0fdfa', borderBottom: `1px solid ${BORDER}` }}>
                        <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 600, color: MUTED }}>Production</th>
                        <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 600, color: MUTED }}>Finished Output</th>
                        <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 600, color: MUTED }}>Raw Finish Used</th>
                        <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 600, color: MUTED }}>Completed</th>
                        <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 600, color: MUTED }}>Available for Costing</th>
                        <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 600, color: MUTED }}>Used Here</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costingModal.productionCandidates.map(production => (
                        <tr key={production.productionId} style={{ borderBottom: '1px solid #f1f5f9', background: production.usedForEntry ? '#f0fdfa' : 'transparent' }}>
                          <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>
                            <strong>#{production.productionId}</strong><br />
                            <span style={{ color: MUTED }}>{moment(production.productionDate).format('DD MMM YYYY HH:mm')}</span>
                          </td>
                          <td style={{ padding: '9px 10px' }}>{production.finishedProductName || costingModal.entryDetails.productName}</td>
                          <td style={{ padding: '9px 10px' }}>{production.rawProductName || '—'}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 600 }}>{production.completedProductionQty} Pcs</td>
                          <td style={{ padding: '9px 10px', textAlign: 'center', fontSize: 11.5, color: '#0f766e' }}>
                            {production.availableProductionQty == null
                              ? '—'
                              : `${production.availableProductionQty} Pcs`}
                          </td>
                          <td style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 700, color: production.usedForEntry ? '#0f766e' : MUTED }}>
                            {production.matchedFinishedQty > 0 ? `${production.matchedFinishedQty} Pcs` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Step 3-5: Matched Purchases Table */}
            <div style={{ fontSize: 12.5, fontWeight: 700, color: INK, marginBottom: 8 }}>
              {isFinishedFinishCosting
                ? 'STEPS 3-5: MATCHED RAW-FINISH PURCHASES (LATEST TO OLDEST)'
                : 'STEPS 2-5: MATCHED PRIOR PURCHASES (LATEST TO OLDEST)'}
            </div>
            <div style={{ fontSize: 12, color: '#6d28d9', marginBottom: 8 }}>
              {isFinishedFinishCosting
                ? 'Raw finishes resolved from production: '
                : 'Matching product: '}
              <strong>{isFinishedFinishCosting
                ? [...new Set(costingModal.productionSources.map(source => source.rawProductName).filter(Boolean))].join(' · ') || 'None found'
                : costingModal.entryDetails.productName}</strong>
            </div>
            {costingModal.matchedPurchases.some(p => p.amountIsQuantity) && (
              <div style={{ color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px', marginBottom: 10, fontSize: 12 }}>
                Tally supplied piece quantities for these purchases, not rupee values. Enter the actual unit cost for every listed purchase.
              </div>
            )}

            {costingModal.matchedPurchases.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: MUTED, background: '#f8fafc', borderRadius: 12, border: `1px solid ${BORDER}` }}>
                {isFinishedFinishCosting
                  ? costingModal.productionCandidates.length === 0
                    ? 'No completed production for this finished product was found before the entry timestamp.'
                    : 'No matching prior Tally purchases were found for the resolved raw finishes before the finished entry date.'
                  : 'No matching prior Tally purchases found for this product before entry date.'}
              </div>
            ) : (
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: MUTED }}>Purchase Date</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: MUTED }}>Supplier / Dealer</th>
                      {isFinishedFinishCosting && (
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: MUTED }}>Raw Finish Source</th>
                      )}
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: MUTED }}>Product Purchased</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: MUTED }}>Matched Qty</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: MUTED }}>Unit Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costingModal.matchedPurchases.map(p => (
                      <tr key={p.purchaseId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                          {moment(p.date).format('DD MMM YYYY')}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                          {p.dealerName || '—'}
                        </td>
                        {isFinishedFinishCosting && (
                          <td style={{ padding: '10px 12px', fontSize: 12.5, color: '#0f766e' }}>
                            {p.rawProductName || '—'}
                          </td>
                        )}
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>
                          {p.productName || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#7c3aed' }}>
                          {p.matchedQty} Pcs
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <Input
                            type="number"
                            style={{ width: 120, textAlign: 'right', fontWeight: 600 }}
                            value={costingModal.unitCosts[p.purchaseId] ?? ''}
                            onChange={(e) => {
                              const rawValue = e.target.value
                              const val = rawValue === '' ? null : Number(rawValue)
                              setCostingModal(prev => ({
                                ...prev,
                                unitCosts: { ...prev.unitCosts, [p.purchaseId]: val }
                              }))
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Step 6: Calculation Result Banner */}
            <div style={{ background: '#faf5ff', border: '1px solid #c084fc', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                STEPS 6-7: WEIGHTED AVERAGE COSTING RESULT
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, color: MUTED }}>Weighted Average Unit Cost:</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#6b21a8' }}>
                    ₹{modalCalculations.weightedAvgCost.toLocaleString('en-IN')} <span style={{ fontSize: 13, fontWeight: 500 }}>/ piece</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: MUTED }}>Total Entry Costing ({costingModal.entryDetails.quantity} Pcs):</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: INK }}>
                    ₹{modalCalculations.totalCost.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ─── XML Paste Import Modal ─── */}
      <Modal
        open={xmlModal.open}
        onCancel={() => setXmlModal(prev => ({ ...prev, open: false }))}
        footer={null}
        width={xmlModal.step === 'preview' ? 860 : 620}
        title={
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16 }}>
            {xmlModal.step === 'paste' && <><CodeOutlined style={{ color: '#1e1b4b', marginRight: 8 }} />Paste Tally XML Export</>}
            {xmlModal.step === 'preview' && <><ImportOutlined style={{ color: '#047857', marginRight: 8 }} />Preview Vouchers — Confirm Archive</>}
            {xmlModal.step === 'done' && <><CheckOutlined style={{ color: '#047857', marginRight: 8 }} />Archive Complete</>}
          </div>
        }
        destroyOnClose
      >
        {/* ── Step 1: Paste XML ── */}
        {xmlModal.step === 'paste' && (
          <div style={{ fontFamily: FONT }}>
            <div style={{ background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
              <strong>How to export from Tally ERP 9:</strong>
              <ol style={{ margin: '6px 0 0 16px', padding: 0, lineHeight: '22px' }}>
                <li>Open Tally → <b>Gateway of Tally → Display → Account Books → Day Book</b></li>
                <li>Set your date range with <b>F2</b></li>
                <li>Press <b>Ctrl+E</b> (Export) → choose format <b>XML</b></li>
                <li>Choose the file below, or open it and paste its contents into the text box</li>
              </ol>
            </div>

            <div style={{ border: `1px dashed #818cf8`, background: '#eef2ff', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#3730a3', marginBottom: 7 }}>IMPORT XML FILE (recommended for large exports)</div>
              <input
                type="file"
                accept=".xml,text/xml,application/xml"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 250 * 1024 * 1024) {
                    message.error('XML file must be 250 MB or smaller')
                    e.target.value = ''
                    return
                  }
                  setXmlModal(prev => ({ ...prev, file, xml: '' }))
                }}
                style={{ width: '100%', fontSize: 13 }}
              />
              {xmlModal.file && (
                <div style={{ fontSize: 12, color: '#3730a3', marginTop: 7 }}>
                  Selected: <b>{xmlModal.file.name}</b> ({(xmlModal.file.size / (1024 * 1024)).toFixed(1)} MB)
                </div>
              )}
            </div>

            <TextArea
              rows={10}
              placeholder="<ENVELOPE><HEADER>...</HEADER><BODY>...</BODY></ENVELOPE>"
              value={xmlModal.xml}
              disabled={Boolean(xmlModal.file)}
              onChange={e => setXmlModal(prev => ({ ...prev, xml: e.target.value, file: null }))}
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, borderRadius: 8 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button
                onClick={() => setXmlModal(prev => ({ ...prev, open: false }))}
                style={{ padding: '8px 18px', borderRadius: 999, border: `1px solid ${BORDER}`, background: 'white', cursor: 'pointer', fontSize: 13 }}
              >Cancel</button>
              <button
                onClick={parseXmlVouchers}
                disabled={xmlModal.parsing || (!xmlModal.file && !xmlModal.xml.trim())}
                style={{
                  padding: '8px 20px', borderRadius: 999, border: 'none',
                  background: (xmlModal.file || xmlModal.xml.trim()) ? '#1e1b4b' : '#9ca3af',
                  color: 'white', fontWeight: 600, fontSize: 13,
                  cursor: (xmlModal.file || xmlModal.xml.trim()) ? 'pointer' : 'not-allowed'
                }}
              >
                {xmlModal.parsing ? 'Parsing…' : 'Parse XML →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {xmlModal.step === 'preview' && xmlModal.preview && (
          <div style={{ fontFamily: FONT }}>
            {/* Summary row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Vouchers', val: xmlModal.preview.total, color: '#1e1b4b', bg: '#eef2ff' },
                { label: 'Matched Dealers', val: xmlModal.preview.matched, color: '#047857', bg: '#ecfdf5' },
                { label: 'Unmatched (skip)', val: xmlModal.preview.unmatched, color: '#b45309', bg: '#fffbeb' }
              ].map(({ label, val, color, bg }) => (
                <div key={label} style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 10, padding: '8px 16px', flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
                </div>
              ))}
            </div>
            {xmlModal.preview.quantityOnly > 0 && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                <WarningOutlined /> This export contains quantity-only vouchers ({xmlModal.preview.quantityOnly}). Their <b>AMOUNT</b> fields are piece counts, not rupee values; import will preserve quantity and set amount to ₹0.
              </div>
            )}

            {/* Voucher table */}
            <div style={{ maxHeight: 380, overflowY: 'auto', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    {['Date', 'Voucher #', 'Type', 'Party / Dealer', 'Amount / Qty', 'Match'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: MUTED, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {xmlModal.preview.vouchers.map((v, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, background: v.dealerMatch ? 'white' : '#fffbeb' }}>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{v.date || '—'}</td>
                      <td style={{ padding: '9px 12px', fontWeight: 600 }}>{v.voucherNumber || '—'}</td>
                      <td style={{ padding: '9px 12px', color: MUTED, whiteSpace: 'nowrap' }}>{v.voucherTypeName || '—'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ fontWeight: 500 }}>{v.partyLedgerName || '—'}</div>
                        {v.dealerMatch && <div style={{ fontSize: 11.5, color: '#047857' }}>→ {v.dealerMatch.name}</div>}
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: v.amountIsQuantity ? '#b45309' : INK }}>
                        {v.amountIsQuantity ? `Qty ${Number(v.quantity || v.amount || 0).toLocaleString('en-IN')} pcs` : `₹${Number(v.amount || 0).toLocaleString('en-IN')}`}
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                        {v.dealerMatch
                          ? <span style={{ color: '#047857', fontWeight: 700, fontSize: 12 }}><CheckOutlined /> Match</span>
                          : <span style={{ color: '#b45309', fontSize: 12 }}><WarningOutlined /> Skip</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {xmlModal.preview.matched === 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                <WarningOutlined /> No vouchers matched any dealer in Plati. Check that party names in Tally match dealer names here.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button
                onClick={() => setXmlModal(prev => ({ ...prev, step: 'paste' }))}
                style={{ padding: '8px 18px', borderRadius: 999, border: `1px solid ${BORDER}`, background: 'white', cursor: 'pointer', fontSize: 13 }}
              >← Back</button>
              <button
                onClick={importFromXml}
                disabled={xmlModal.importing || xmlModal.preview.total === 0}
                style={{
                  padding: '8px 20px', borderRadius: 999, border: 'none',
                  background: xmlModal.preview.total > 0 ? '#047857' : '#9ca3af',
                  color: 'white', fontWeight: 600, fontSize: 13,
                  cursor: (xmlModal.importing || xmlModal.preview.total === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                {xmlModal.importing ? 'Archiving…' : `Archive ${xmlModal.preview.total} Voucher${xmlModal.preview.total !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {xmlModal.step === 'done' && xmlModal.result && (
          <div style={{ fontFamily: FONT, textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#047857', marginBottom: 6 }}>Archive Complete</div>
            <div style={{ fontSize: 14, color: MUTED, marginBottom: 20 }}>{xmlModal.result.message}</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '10px 24px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Archived</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#047857' }}>{xmlModal.result.archivedCount}</div>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 24px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Already Present</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#b45309' }}>{xmlModal.result.skippedExisting}</div>
              </div>
            </div>
            <button
              onClick={() => setXmlModal(prev => ({ ...prev, open: false }))}
              style={{ padding: '10px 28px', borderRadius: 999, border: 'none', background: '#1e1b4b', color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >Close</button>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PhysicalBillTallyDesk
